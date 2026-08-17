const JSON_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Thrown by `makeRequest` for a non-2xx response. `status` and `body` (the
 * response's parsed JSON, when it had any) are exposed so a caller that needs
 * to branch on more than "it failed" — e.g. a backend error `code` — doesn't
 * need its own fetch/parsing logic; most callers still just let it propagate
 * as a generic failure, unchanged from before this existed.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`HTTP error! status: ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

const makeRequest = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    // Best-effort: an empty or non-JSON error body must not stop the failure
    // itself from surfacing.
    const body = await response.json().catch(() => null);
    throw new HttpError(response.status, body);
  }

  // A 204 (e.g. every DELETE this proxies) has no body by definition —
  // `.json()` on an empty body throws `SyntaxError: Unexpected end of JSON
  // input`, which would surface a successful delete as a thrown error.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const get = <T>(url: string): Promise<T> => {
  return makeRequest<T>(url, {
    method: "GET",
    headers: JSON_HEADERS,
  });
};

const post = <T>(url: string, body: unknown): Promise<T> => {
  return makeRequest<T>(url, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
};

const patch = <T>(url: string, body: unknown): Promise<T> => {
  return makeRequest<T>(url, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
};

const del = (url: string): Promise<void> => {
  return makeRequest<void>(url, {
    method: "DELETE",
    headers: JSON_HEADERS,
  });
};

export const httpClient = {
  get,
  post,
  patch,
  delete: del,
};
