import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Player name is required" })
});

export const joinRoomSchema = z.object({
  playerName: z.string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Player name is required" })
});

export const startGameSchema = z.object({
  participantId: z.string().min(1)
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const updateCanvasSchema = z.object({
  participantId: z.string().min(1),
  stroke: z.object({
    points: z.array(
      z.object({
        x: z.number().min(0).max(1000),
        y: z.number().min(0).max(1000)
      })
    ).min(2, "Stroke must have at least 2 points").max(500, "Stroke cannot exceed 500 points"),
    color: z.string().min(1),
    width: z.number().int().positive()
  })
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1)
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guess: z.string().min(1, "Guess cannot be empty").max(100, "Guess must be 100 characters or less")
});

export const endRoundSchema = z.object({
  participantId: z.string().min(1)
});

export const restartGameSchema = z.object({
  participantId: z.string().min(1)
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
