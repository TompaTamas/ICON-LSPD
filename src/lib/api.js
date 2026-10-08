export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN_KEY = 'icon-lspd-token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* privát böngészés: a belépés csak erre a munkamenetre él */
  }
}

export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** JSON API-hívás; hibánál ApiError-t dob a szerver magyar üzenetével. */
export async function api(path, { method = 'GET', body, raw = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'Nem érem el a szervert. Próbáld újra pár perc múlva.', 'HALOZAT');
  }
  if (raw && res.ok) return res;
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new ApiError(res.status, data?.hiba ?? `Hiba történt (${res.status}).`, data?.kod);
  return data;
}

export const loginUrl = (vissza = '/') => `${API_URL}/auth/login?vissza=${encodeURIComponent(vissza)}`;
export const devLoginUrl = (szint, vissza = '/') => `${API_URL}/auth/dev?szint=${szint}&vissza=${encodeURIComponent(vissza)}`;
