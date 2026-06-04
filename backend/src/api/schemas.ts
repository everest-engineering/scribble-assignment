import { z } from "zod";

const trimmedName = z.string().trim().min(1, "Name cannot be empty");

export const createRoomSchema = z.object({
  playerName: trimmedName
});

export const joinRoomSchema = z.object({
  playerName: trimmedName
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  text: z.string().trim().min(1, "Guess cannot be empty")
});

export const restartGameSchema = z.object({
  participantId: z.string()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
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
