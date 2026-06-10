const API_URL = import.meta.env.VITE_API_URL ?? '';

export function getAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function setSession(session) {
  localStorage.setItem('token', session.token);
  localStorage.setItem('user', JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Falha na requisição.');
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    return response.text();
  }

  return response.json();
}
