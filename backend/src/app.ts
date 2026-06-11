import cors from "cors";
import express from "express";
import { createApiRouter, errorHandler, notFoundHandler } from "./api/router.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.use(createApiRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
