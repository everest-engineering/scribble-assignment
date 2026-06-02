import { z } from "zod";

const trimmedNonEmpty = () =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: "playerName is required" });

export const createRoomSchema = z.object({
  playerName: trimmedNonEmpty(),
});

export const joinRoomSchema = z.object({
  playerName: trimmedNonEmpty(),
});

export const roomCodeParamsSchema = z.object({
  code: z.string(),
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional(),
});

const participantActionSchema = z.object({
  participantId: z.string(),
});

export const startRoomSchema = participantActionSchema;

export const guessSchema = participantActionSchema.extend({
  guess: trimmedNonEmpty(),
});

const drawingPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const drawingPathSchema = participantActionSchema.extend({
  path: z.object({
    points: z.array(drawingPointSchema).min(1),
    color: z.string().optional(),
    width: z.number().optional(),
  }),
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
