import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1).optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1).optional()
});

export const startGameSchema = z.object({
  hostId: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  guess: z.string().trim().min(1, "Guess cannot be empty")
});

export const drawActionSchema = z.object({
  participantId: z.string(),
  commands: z.array(z.discriminatedUnion("type", [
    z.object({ type: z.literal("stroke"), points: z.array(z.object({ x: z.number(), y: z.number() })) }),
    z.object({ type: z.literal("clear") })
  ]))
});

export const clearCanvasSchema = z.object({
  participantId: z.string()
});

export const restartGameSchema = z.object({
  hostId: z.string()
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
