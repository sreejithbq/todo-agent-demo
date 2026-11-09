import { ZodError } from "zod";
import { HttpError } from "../errors/http-error.js";

export function notFoundHandler(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    });
  }

  if (err instanceof HttpError) {
    const error = { message: err.message };

    if (err.details !== undefined) {
      error.details = err.details;
    }

    return res.status(err.statusCode).json({ error });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      error: { message: "Invalid JSON body" },
    });
  }

  console.error(err);

  return res.status(500).json({
    error: { message: "Internal server error" },
  });
}
