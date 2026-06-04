import cors from "cors";
import express, { type Request, type Response, type NextFunction } from "express";
import { createApiRouter, errorHandler, notFoundHandler } from "./api/router.js";
import { randomUUID } from "crypto";

// In-memory models and store (Node.js 18, in-memory only per constitution)
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

interface Room {
  id: string;
  code: string; // 4-letter room code
  players: Player[];
  gameStarted: boolean;
  createdAt: string;
}

const rooms: Map<string, Room> = new Map();

function generateRoomCode(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  while (true) {
    let code = "";
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    if (!rooms.has(code)) return code;
  }
}

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.use(createApiRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
