import { ensureFreshSession } from "@/lib/supabase/ensure-session";

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

const makeRequest = async <T>(
  url: string,
  options?: RequestInit,
  // How a successful body is read: JSON for every API call, a blob for a file.
  parse: (response: Response) => Promise<T> = (response) => response.json() as Promise<T>,
): Promise<T> => {
  // Before the fetch, not after: the request authenticates with the session
  // cookie the browser holds at the moment it goes out. Refreshing here means
  // one refresh per burst, serialized by the browser client, instead of one
  // per parallel request in its own isolated edge invocation — see
  // ensureFreshSession.
  await ensureFreshSession();

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

  return parse(response);
};

const get = <T>(url: string): Promise<T> => {
  return makeRequest<T>(url, {
    method: "GET",
    headers: JSON_HEADERS,
  });
};

export type DownloadedFile = {
  blob: Blob;
  /** The name the server gave the file (`Content-Disposition`), when it gave one. */
  filename?: string;
};

// Quoted form only — the one the backend sends (`attachment; filename="x.pdf"`).
const FILENAME_PATTERN = /filename="([^"]+)"/;

/**
 * A GET for an endpoint that answers with a file. Same session refresh and same
 * `HttpError` on a non-2xx as every other call — the proxy keeps a backend
 * error's JSON body, so a failed download is read like a failed API call.
 */
const getFile = (url: string): Promise<DownloadedFile> => {
  return makeRequest<DownloadedFile>(url, { method: "GET" }, async (response) => ({
    blob: await response.blob(),
    filename: FILENAME_PATTERN.exec(response.headers.get("Content-Disposition") ?? "")?.[1],
  }));
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

const put = <T>(url: string, body: unknown): Promise<T> => {
  return makeRequest<T>(url, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
};

// `body` is optional: most DELETEs this app makes are bare (the resource is
// addressed entirely by its URL), but a caller-scoped resource with no id of
// its own in the URL — a push subscription is identified by its `endpoint`,
// not a path segment — needs one to say *which* one to remove. No existing
// call site in this app needed a DELETE body before push subscriptions, so
// this is the only sibling to check when adding another one.
const del = (url: string, body?: unknown): Promise<void> => {
  return makeRequest<void>(url, {
    method: "DELETE",
    headers: JSON_HEADERS,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
};

export const httpClient = {
  get,
  getFile,
  post,
  patch,
  put,
  delete: del,
};
