const BASE = `${(import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8001'}/api`;
const TOKEN_KEY = 'luvhere_crm_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

type Query = Record<string, string | number | boolean | null | undefined>;

export async function api<T = any>(method: string, path: string, opts: { query?: Query; body?: unknown } = {}): Promise<T> {
  const url = new URL(BASE + path);
  Object.entries(opts.query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401) onUnauthorized();
    const firstError = data?.errors ? Object.values<string[]>(data.errors)[0]?.[0] : undefined;
    throw new ApiError(res.status, firstError ?? data?.message ?? `Request failed (${res.status})`, data?.errors);
  }
  return data as T;
}

export const get = <T = any>(path: string, query?: Query) => api<T>('GET', path, { query });
export const post = <T = any>(path: string, body?: unknown) => api<T>('POST', path, { body: body ?? {} });
export const put = <T = any>(path: string, body?: unknown) => api<T>('PUT', path, { body: body ?? {} });
export const del = <T = any>(path: string) => api<T>('DELETE', path);

export type Page<T> = { data: T[]; current_page: number; last_page: number; total: number; per_page: number };
