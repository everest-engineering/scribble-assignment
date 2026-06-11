import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const startGameQuerySchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const guessBodySchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  text: z.string().min(1, "Guess cannot be empty")
});

export const strokeBodySchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(1, "points array must not be empty")
});

export const clearBodySchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const revealQuerySchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const restartQuerySchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
