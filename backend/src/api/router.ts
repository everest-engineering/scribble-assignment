import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { createRoomsRouter } from "./rooms.js";

export function createApiRouter() {
  const router = Router();

  router.get("/", (_request, response) => {
    response.json({
      ok: true,
      service: "scribble-api",
    });
  });

  router.use("/rooms", createRoomsRouter());

  return router;
}

export function notFoundHandler(_request: Request, response: Response) {
  response.status(404).json({
    message: "Route not found",
  });
}

export function errorHandler(
  error: Error & { statusCode?: number },
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error.name === "ZodError") {
    response.status(400).json({ message: "Invalid request payload" });
    return;
  }
  // If the error is an HttpError with a payload, return the payload directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyError = error as any;

  if (anyError && anyError.payload && typeof anyError.statusCode === "number") {
    response.status(anyError.statusCode).json(anyError.payload);
    return;
  }

  const statusCode = error.statusCode ?? 500;
  response.status(statusCode).json({
    message: error.message || "Unexpected server error",
  });
}
