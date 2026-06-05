import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Player name cannot be empty"))
});

export const joinRoomSchema = z.object({
  playerName: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Player name cannot be empty"))
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1)
});

export const strokeSchema = z.object({
  participantId: z.string().min(1),
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(1)
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1)
});

export const endRoundSchema = z.object({
  participantId: z.string().min(1)
});

export const restartRoomSchema = z.object({
  participantId: z.string().min(1)
});

export const guessSchema = z.object({
  participantId: z.string().min(1),
  text: z.string().transform((s) => s.trim()).pipe(z.string().min(1, "Guess cannot be empty"))
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
