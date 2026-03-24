type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('zentra_token');
}

export async function apiRequest<T>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}
