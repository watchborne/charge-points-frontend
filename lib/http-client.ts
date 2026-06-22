const JSON_HEADERS = {
  "Content-Type": "application/json",
};

export async function httpClient<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function get<T>(url: string): Promise<T> {
  return httpClient<T>(url, { method: "GET", headers: JSON_HEADERS });
}

export function post<T>(url: string, body: unknown): Promise<T> {
  return httpClient<T>(url, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function patch<T>(url: string, body: unknown): Promise<T> {
  return httpClient<T>(url, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

export function del(url: string): Promise<void> {
  return httpClient<void>(url, { method: "DELETE" });
}
