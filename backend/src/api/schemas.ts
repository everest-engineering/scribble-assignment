import { z } from "zod";

const playerNameSchema = z.string().trim().min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

const guessTextSchema = z.string().trim().min(1, "Guess cannot be empty").max(100, "Guess is too long (max 100 characters)");

export const submitGuessSchema = z.object({
  participantId: z.string(),
  text: guessTextSchema
});

export const saveCanvasSchema = z.object({
  participantId: z.string(),
  strokes: z.array(z.array(z.object({ x: z.number(), y: z.number() })))
});

export const clearCanvasSchema = z.object({
  participantId: z.string()
});

export const endRoundSchema = z.object({
  participantId: z.string()
});

export const restartGameSchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
