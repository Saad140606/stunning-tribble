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

  // Debug logging for auth endpoints (helpful during development)
  if (endpoint.includes('/auth/login') || endpoint.includes('/auth/refresh')) {
    try {
      const clone = response.clone();
      const contentType = clone.headers.get('content-type') || '';
      let body: any = null;
      if (contentType.includes('application/json')) body = await clone.json();
      else body = await clone.text();
      console.debug(`[apiFetch] ${endpoint} -> ${response.status}`, body);
    } catch (err) {
      console.debug(`[apiFetch] ${endpoint} -> ${response.status} (failed to parse body)`, err);
    }
  }

  // If unauthorized or token expired, attempt to refresh token and retry once
  if ((response.status === 401 || response.status === 403) && !options.skipAuth) {
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
    // Try refresh using stored refresh token (falls back to cookie if not available)
    const storedRefresh = localStorage.getItem('refreshToken');
    const body = storedRefresh ? JSON.stringify({ refreshToken: storedRefresh }) : undefined;
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        return true;
      }
    }
    // If stored refresh token was rejected (403), try cookie-only refresh as a fallback
    if (response && response.status === 403 && localStorage.getItem('refreshToken')) {
      try {
        localStorage.removeItem('refreshToken');
        const cookieOnly = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (cookieOnly.ok) {
          const data2 = await cookieOnly.json();
          if (data2.accessToken) {
            setAccessToken(data2.accessToken);
            return true;
          }
        }
      } catch (err) {
        console.error('Cookie-only refresh failed:', err);
      }
    }
  } catch (err) {
    console.error('Failed to auto-refresh access token:', err);
  }

  // Clear access token if refresh fails
  setAccessToken(null);
  return false;
}
