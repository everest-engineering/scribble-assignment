import { z } from "zod";

const trimmedNonEmptyString = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "Name is required" });

export const createRoomSchema = z.object({
  playerName: trimmedNonEmptyString
});

export const joinRoomSchema = z.object({
  playerName: trimmedNonEmptyString
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length > 0, { message: "Room code is required" })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().uuid()
});

export const startGameQuerySchema = z.object({
  participantId: z.string().uuid()
});

export const restartGameQuerySchema = z.object({
  participantId: z.string().uuid()
});

const canvasPointSchema = z.object({
  x: z.number(),
  y: z.number()
});

const canvasStrokeSchema = z.object({
  points: z.array(canvasPointSchema).min(1),
  color: z.string().optional(),
  width: z.number().optional()
});

export const updateCanvasBodySchema = z.object({
  strokes: z.array(canvasStrokeSchema)
});

export const submitGuessBodySchema = z.object({
  text: z.string()
});

export const gameplayQuerySchema = z.object({
  participantId: z.string().uuid()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
