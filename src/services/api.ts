const API_BASE_URL = 'http://localhost:8000/api';

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
    const storedRefresh = localStorage.getItem('refreshToken'); // Fallback if cookie not set/accessible
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: storedRefresh }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.accessToken) {
        setAccessToken(data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        return true;
      }
    }
  } catch (err) {
    console.error('Failed to auto-refresh access token:', err);
  }
  
  // Clear tokens if refresh fails
  setAccessToken(null);
  localStorage.removeItem('refreshToken');
  return false;
}
