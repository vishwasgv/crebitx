/**
 * Server-side API helper using native fetch.
 * Safe to call from server actions and server components.
 * Does NOT use localStorage, window, or other browser-only APIs.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

async function serverFetch<T = unknown>(
  method: Method,
  path: string,
  token: string,
  body?: unknown
): Promise<T> {
  const url = `${API_URL}${path}`

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${method} ${path} failed with ${res.status}: ${text}`)
  }

  const json = await res.json()
  return (json?.data ?? json) as T
}

export const serverApi = {
  get: <T = unknown>(path: string, token: string) =>
    serverFetch<T>("GET", path, token),

  post: <T = unknown>(path: string, token: string, body: unknown) =>
    serverFetch<T>("POST", path, token, body),

  patch: <T = unknown>(path: string, token: string, body: unknown) =>
    serverFetch<T>("PATCH", path, token, body),

  put: <T = unknown>(path: string, token: string, body: unknown) =>
    serverFetch<T>("PUT", path, token, body),

  delete: <T = unknown>(path: string, token: string) =>
    serverFetch<T>("DELETE", path, token),
}
