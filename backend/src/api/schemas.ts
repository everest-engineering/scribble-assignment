import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1)
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1)
});

export const startGameSchema = z.object({
  participantId: z.string().uuid()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const strokeSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("draw"),
    participantId: z.string().uuid(),
    x0: z.number(),
    y0: z.number(),
    x1: z.number(),
    y1: z.number(),
    color: z.string(),
    lineWidth: z.number().positive()
  }),
  z.object({
    type: z.literal("clear"),
    participantId: z.string().uuid()
  })
]);

export const guessSchema = z.object({
  participantId: z.string().uuid(),
  guess: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
