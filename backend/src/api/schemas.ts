import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required")
});

export const startGameBodySchema = z.object({
  participantId: z.string()
});

export const roomCodeParamsSchema = z.object({
  code: z.string().min(1, "Room code is required")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const updateDrawingSchema = z.object({
  participantId: z.string(),
  strokes: z.array(
    z.object({
      points: z.array(
        z.object({
          x: z.number(),
          y: z.number()
        })
      ),
      color: z.string().optional(),
      size: z.number().optional()
    })
  )
});

export const clearDrawingSchema = z.object({
  participantId: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  value: z.string().trim().min(1, "Guess is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
