import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(1, "Player name is required")
});

export const submitGuessSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Guess cannot be empty")
});

export const saveCanvasSchema = z.object({
  lines: z.array(z.string())
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4}$/, "Room code must be 4 letters or numbers")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
