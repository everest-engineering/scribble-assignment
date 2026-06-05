import { z } from "zod";

const playerNameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(z.string().min(1, "Player name is required"));

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Room code is required")
    .transform((value) => value.toUpperCase())
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

const MAX_STROKE_POINTS = 2000;

const strokePointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const strokeSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  stroke: z.object({
    points: z.array(strokePointSchema).min(1, "A stroke needs at least one point").max(MAX_STROKE_POINTS)
  })
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const guessSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  guess: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, "Guess is required"))
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
