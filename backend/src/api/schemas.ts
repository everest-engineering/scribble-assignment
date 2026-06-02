import { z } from "zod";

const trimmedRequiredString = z.string().trim().min(1, "Value is required after trimming");

export const playerNameSchema = trimmedRequiredString;

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().length(4, "Room code must be exactly 4 characters")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string()
});

const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

export const drawingPointSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1)
});

export const drawingStrokeSchema = z.object({
  color: z.string().regex(hexColorRegex, "Color must be a valid hex color"),
  size: z.number().int().min(1).max(20),
  points: z.array(drawingPointSchema).min(2, "Stroke must have at least 2 points").max(500)
});

export const appendDrawingSchema = z.object({
  participantId: z.string(),
  stroke: drawingStrokeSchema
});

export const clearDrawingSchema = z.object({
  participantId: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  guess: trimmedRequiredString
});

export const endRoundSchema = z.object({
  participantId: z.string()
});

export const restartRoomSchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
