import { z } from "zod";

const roomCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{4}$/, "Room code must be 4 characters"));

const playerNameSchema = z.string().trim().min(1, "Player name is required").max(40);
const participantIdSchema = z.string().trim().min(1, "Participant ID is required");
const drawingPointSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1)
});
const drawingStrokeSchema = z.object({
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex color"),
  size: z.number().finite().min(1).max(24),
  points: z.array(drawingPointSchema).min(2).max(500)
});
const guessTextSchema = z.string().trim().min(1, "Guess is required").max(80);

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: participantIdSchema.optional()
});

export const startRoomSchema = z.object({
  participantId: participantIdSchema
});

export const drawingSchema = z.object({
  participantId: participantIdSchema,
  stroke: drawingStrokeSchema
});

export const clearDrawingSchema = z.object({
  participantId: participantIdSchema
});

export const guessSchema = z.object({
  participantId: participantIdSchema,
  guess: guessTextSchema
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
