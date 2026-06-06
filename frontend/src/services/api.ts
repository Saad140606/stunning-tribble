const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000') + '/api';


let accessToken: string | null = localStorage.getItem('accessToken');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = () => accessToken;

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(endpoint: string, options: RequestOptions = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!options.skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  // Ensure credentials are sent (for HttpOnly cookies if used)
  config.credentials = 'include';

  let response = await fetch(url, config);

  // If unauthorized, attempt to refresh token and retry once
  if (response.status === 401 && !options.skipAuth) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry request with new token
      headers.set('Authorization', `Bearer ${accessToken}`);
      response = await fetch(url, config);
    }
  }

  return response;
}

async function attemptTokenRefresh(): Promise<boolean> {
  try {
    // HttpOnly cookie is sent automatically via credentials: 'include'
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        return true;
      }
    }
  } catch (err) {
    console.error('Failed to auto-refresh access token:', err);
  }

  // Clear access token if refresh fails
  setAccessToken(null);
  return false;
}
