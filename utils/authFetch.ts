/**
 * utils/authFetch.ts
 *
 * Client-side authenticated fetch utility.
 * Automatically attaches the current Firebase ID token to every request.
 */

import { getAuth } from "firebase/auth";

interface AuthFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Fetches a URL with the current user's Firebase ID token attached
 * as a Bearer token in the Authorization header.
 */
export async function authFetch(
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers = {}, ...rest } = options;

  let authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user found. Please sign in.");
      }
      const token = await user.getIdToken(false);
      authHeaders["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.error("[authFetch] Failed to get ID token:", err);
      throw err;
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: authHeaders,
  });

  return response;
}

/**
 * Convenience wrapper that parses JSON and throws on non-2xx responses.
 */
export async function authFetchJson<T = unknown>(
  url: string,
  options: AuthFetchOptions = {}
): Promise<T> {
  const response = await authFetch(url, options);

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error ?? errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
