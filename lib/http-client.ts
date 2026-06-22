const JSON_HEADERS = {
  "Content-Type": "application/json",
};

function getApiKeyHeader(): Record<string, string> {
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) return {};
  return { "x-api-key": apiKey };
}

const makeRequest = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

const get = <T>(url: string): Promise<T> => {
  return makeRequest<T>(url, {
    method: "GET",
    headers: { ...JSON_HEADERS, ...getApiKeyHeader() },
  });
};

const post = <T>(url: string, body: unknown): Promise<T> => {
  return makeRequest<T>(url, {
    method: "POST",
    headers: { ...JSON_HEADERS, ...getApiKeyHeader() },
    body: JSON.stringify(body),
  });
};

const patch = <T>(url: string, body: unknown): Promise<T> => {
  return makeRequest<T>(url, {
    method: "PATCH",
    headers: { ...JSON_HEADERS, ...getApiKeyHeader() },
    body: JSON.stringify(body),
  });
};

const del = (url: string): Promise<void> => {
  return makeRequest<void>(url, {
    method: "DELETE",
    headers: { ...JSON_HEADERS, ...getApiKeyHeader() },
  });
};

export const httpClient = {
  get,
  post,
  patch,
  delete: del,
};
