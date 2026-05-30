import { z } from "zod";

const roomCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .refine((value) => /^[A-Z0-9]{4}$/.test(value), {
    message: "Room code must be 4 uppercase letters or numbers"
  });

const playerNameSchema = z
  .string()
  .trim()
  .min(1, { message: "Player name must include at least one non-space character" });

const participantIdSchema = z.string().trim().min(1, {
  message: "Participant ID is required"
});

const drawingPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1)
});

const guessSchema = z.string().trim().min(1, {
  message: "Guess must include at least one non-space character"
});

export const createRoomSchema = z.object({
  playerName: playerNameSchema.optional()
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema.optional()
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: participantIdSchema
});

export const drawingStrokeSchema = z.object({
  participantId: participantIdSchema,
  points: z.array(drawingPointSchema).min(1, {
    message: "At least one drawing point is required"
  })
});

export const clearCanvasSchema = z.object({
  participantId: participantIdSchema
});

export const submitGuessSchema = z.object({
  participantId: participantIdSchema,
  guess: guessSchema
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
