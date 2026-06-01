import { z } from "zod";

const trimmedName = z.string().trim().min(1, "Player name cannot be empty");

export const createRoomSchema = z.object({
  playerName: trimmedName.optional()
});

export const joinRoomSchema = z.object({
  playerName: trimmedName.optional()
});

export const roomCodeParamsSchema = z.object({
  code: z.string().min(1, "Room code is required")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const guessSchema = z.object({
  participantId: z.string(),
  word: z.string().trim().min(1, "Guess cannot be empty")
});

export const canvasSchema = z.object({
  participantId: z.string(),
  dataUrl: z.string()
});

export const restartSchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
