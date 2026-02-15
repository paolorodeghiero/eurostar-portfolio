import { InteractionRequiredAuthError, BrowserAuthError } from '@azure/msal-browser';
import { msalInstance, loginRequest, msalInitPromise } from './auth-config';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Cache dev mode status
let isDevModeCache: boolean | null = null;

async function checkIfDevMode(): Promise<boolean> {
  if (isDevModeCache !== null) return isDevModeCache;

  try {
    // Try to call /api/me without any token
    // If backend is in dev mode, it will return the dev user
    const response = await fetch(`${API_URL}/api/me`);
    if (response.ok) {
      const user = await response.json();
      isDevModeCache = user.id === 'dev-user';
      return isDevModeCache;
    }
  } catch {
    // Network error or backend not responding
  }
  isDevModeCache = false;
  return false;
}

export async function getAccessToken(): Promise<string | null> {
  // Ensure MSAL is initialized
  await msalInitPromise;

  // Check if we're in dev mode first
  const devMode = await checkIfDevMode();
  if (devMode) {
    return null; // No token needed in dev mode
  }

  // Get active account, or select first available account
  let account = msalInstance.getActiveAccount();
  if (!account) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      account = accounts[0];
      msalInstance.setActiveAccount(account);
    } else {
      return null; // No accounts - user needs to log in
    }
  }

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    // Debug: Log token info
    console.log('[Auth Debug] Token obtained:', {
      length: response.idToken.length,
      start: response.idToken.substring(0, 50) + '...',
    });
    return response.idToken;
  } catch (error) {
    // Specific error handling for different MSAL errors
    if (error instanceof InteractionRequiredAuthError) {
      // Token expired or consent required - redirect to login
      console.warn('Token expired or consent required, redirecting to login...');
      msalInstance.acquireTokenRedirect(loginRequest);
      return null;
    }
    if (error instanceof BrowserAuthError) {
      console.error('Browser auth error:', error.errorCode, error.errorMessage);
      // Clear bad state and redirect
      msalInstance.acquireTokenRedirect(loginRequest);
      return null;
    }
    // Unknown error - log and redirect
    console.error('Token acquisition failed:', error);
    msalInstance.acquireTokenRedirect(loginRequest);
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit & { _retried?: boolean } = {}
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {};

  // Only set Content-Type for methods with a body
  const method = options.method?.toUpperCase() || 'GET';
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    headers['Content-Type'] = 'application/json';
  }

  // Merge existing headers if present
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Debug: Log the request
  console.log('[Auth Debug] API Request:', {
    endpoint,
    hasToken: !!token,
    tokenStart: token ? token.substring(0, 20) + '...' : 'none',
  });

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 with retry logic - token might be expired on backend
  if (response.status === 401 && !options._retried) {
    console.warn('Got 401, attempting token refresh...');
    const newToken = await getAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      return apiClient(endpoint, { ...options, headers, _retried: true });
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  // Handle empty responses (e.g., 204 No Content)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text);
}

// Helper to get auth headers for custom fetch calls
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to get just the Authorization header (for file uploads with FormData)
export async function getAuthorizationHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

// Temporary debug helper - expose getAccessToken for browser console
// Usage in console: window.__getToken().then(t => console.log(JSON.parse(atob(t.split('.')[1]))))
(window as unknown as Record<string, unknown>).__getToken = getAccessToken;
