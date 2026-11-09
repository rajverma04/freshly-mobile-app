import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const errors: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ message: "Invalid request", issues: err.flatten() });
    return;
  }
  const status =
    err instanceof HttpError ? err.status : err.status === 400 ? 400 : 500;
  if (status === 500) console.error("Request failed", err.name);
  res
    .status(status)
    .json({
      message:
        status === 500
          ? "Something went wrong. Please try again."
          : err.message,
    });
};
