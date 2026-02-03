// Dev mode authentication bypass
// When backend runs with DEV_MODE=true, we can skip MSAL entirely

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DevUser {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
}

export async function checkDevMode(): Promise<DevUser | null> {
  try {
    // Try to call /api/me without any token
    // If backend is in dev mode, it will return the dev user
    const response = await fetch(`${API_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const user = await response.json();
      // Verify it's the dev user (has id: 'dev-user')
      if (user.id === 'dev-user') {
        return user as DevUser;
      }
    }
    return null;
  } catch (error) {
    // Network error or backend not running
    console.log('Dev mode check failed:', error);
    return null;
  }
}

// Simple API client for dev mode (no token required)
export async function devApiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
