import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
    .trim()
    .transform((val) => val.toUpperCase())
    .refine((val) => /^[A-Z0-9]{4}$/.test(val), {
      message: "Invalid room code format"
    })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required")
});

const drawingPointSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1)
});

const drawingStrokeSchema = z.object({
  id: z.string().trim().min(1).max(80),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value"),
  size: z.number().finite().min(1).max(24),
  points: z.array(drawingPointSchema).min(1).max(500)
});

export const updateDrawingSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required"),
  drawing: z.array(drawingStrokeSchema).max(100)
});

export const clearDrawingSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required")
});

export const submitGuessSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required"),
  text: z.string().trim().min(1, "Guess is required").max(80, "Guess must be 80 characters or less")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
