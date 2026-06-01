import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required").max(20, "Player name must be at most 20 characters")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required").max(20, "Player name must be at most 20 characters")
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const leaveRoomSchema = z.object({
  participantId: z.string()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const submitStrokesSchema = z.object({
  participantId: z.string(),
  action: z.enum(["append", "clear"]),
  strokes: z.array(z.object({
    color: z.string(),
    width: z.number().positive(),
    points: z.array(z.object({
      x: z.number(),
      y: z.number()
    })).min(1)
  })).optional()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  text: z.string().trim().min(1, "Guess is required").max(200, "Guess must be at most 200 characters")
});

export const revealWordSchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
