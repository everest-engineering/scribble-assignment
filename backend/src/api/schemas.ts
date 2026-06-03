import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const startRoomSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID")
});

export const addStrokeSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID"),
  stroke: z.object({
    points: z.array(z.object({ x: z.number(), y: z.number() })).min(1, "Stroke must have at least one point"),
    color: z.string().default("#000000"),
    lineWidth: z.number().min(1).max(50).default(4)
  })
});

export const submitGuessSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID"),
  text: z.string().trim().min(1, "Guess cannot be empty")
});

export const endRoundSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID")
});

export const restartRoomSchema = z.object({
  participantId: z.string().uuid("Invalid participant ID")
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
