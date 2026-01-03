import "server-only";

interface BackendRequestOptions {
  path: string;
  method?: string;
  token?: string;
  body?: unknown;
  searchParams?: URLSearchParams;
  cache?: RequestCache;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function callBackend<T>({ path, method = "GET", token, body, searchParams, cache = "no-store" }: BackendRequestOptions): Promise<T> {
  const url = new URL(path, backendUrl);
  if (searchParams) {
    url.search = searchParams.toString();
  }
  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend error (${response.status})`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
