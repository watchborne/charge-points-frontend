const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const makeRequest = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const get = <T>(url: string): Promise<T> => {
  return makeRequest<T>(url, { method: "GET", headers: JSON_HEADERS });
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
  return makeRequest<void>(url, { method: "DELETE" });
};

export const httpClient = {
  get,
  post,
  patch,
  delete: del,
};
