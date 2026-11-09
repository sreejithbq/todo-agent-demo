export class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Task not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}
