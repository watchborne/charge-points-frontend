import { ensureFreshSession } from "@/lib/supabase/ensure-session";

import { HttpError } from "./http-error";

export { HttpError };

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * `fetch` after `ensureFreshSession()`, so a burst of requests refreshes the
 * session once rather than once per request. The OCPP command methods, which
 * read the raw status, call it directly.
 */
export const fetchWithFreshSession = async (
  url: string,
  options?: RequestInit,
): Promise<Response> => {
  await ensureFreshSession();
  return fetch(url, options);
};

const makeRequest = async <T>(
  url: string,
  options?: RequestInit,
  // How a successful body is read: JSON for every API call, a blob for a file.
  parse: (response: Response) => Promise<T> = (response) => response.json() as Promise<T>,
): Promise<T> => {
  const response = await fetchWithFreshSession(url, options);

  if (!response.ok) {
    // Best-effort: an empty or non-JSON error body must not hide the failure.
    const body = await response.json().catch(() => null);
    throw new HttpError(response.status, body);
  }

  // A 204 has no body: `.json()` would throw on it.
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
 * A GET for a file, with the same session refresh and `HttpError` (the proxy
 * keeps a backend error's JSON body).
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

// `body` is optional: a push subscription is identified by its `endpoint`,
// not by the URL.
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
