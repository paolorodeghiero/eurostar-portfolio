import { msalInstance, loginRequest } from './auth-config';

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
  // Check if we're in dev mode first
  const devMode = await checkIfDevMode();
  if (devMode) {
    return null; // No token needed in dev mode
  }

  const account = msalInstance.getActiveAccount();
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({
      ...loginRequest,
      account,
    });
    return response.accessToken;
  } catch (error) {
    // Token expired, try interactive
    try {
      const response = await msalInstance.acquireTokenPopup(loginRequest);
      return response.accessToken;
    } catch (interactiveError) {
      console.error('Token acquisition failed:', interactiveError);
      return null;
    }
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

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
