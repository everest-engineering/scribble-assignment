import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1)
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1)
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guessText: z.string(),
});

export const saveStrokeSchema = z.object({
  path: z.array(z.object({ x: z.number(), y: z.number() })).min(1),
});

export const endRoundSchema = z.object({
  participantId: z.string(),
});

export const restartSchema = z.object({
  participantId: z.string(),
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
