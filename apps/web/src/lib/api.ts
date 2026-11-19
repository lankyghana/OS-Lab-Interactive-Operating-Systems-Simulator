/**
 * Thin client for the OS Lab NestJS API. When NEXT_PUBLIC_API_URL is not set the app
 * runs in guest-only mode and every call here is skipped.
 */

export const API_URL: string =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';

export const apiEnabled = () => API_URL.length > 0;

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  provider: 'local' | 'google';
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit & { token?: string | null } = {}): Promise<T> {
  if (!apiEnabled()) throw new ApiError('The OS Lab server is not configured.', 0);
  const { token, headers, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError('Could not reach the OS Lab server. Check your connection and try again.', 0);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(' ') : body.message ?? message;
    } catch {
      /* not JSON */
    }
    throw new ApiError(message, res.status);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const googleSignInUrl = () => `${API_URL}/auth/google`;
