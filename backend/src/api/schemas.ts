import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const guessSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required"),
  guess: z.string()
});

export const strokeSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(1, "At least one point is required")
});

export const endGameSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const restartSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
