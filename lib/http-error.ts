/**
 * Thrown for a non-2xx response, with its `status` and parsed `body`, for
 * callers that branch on a backend error `code`.
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
