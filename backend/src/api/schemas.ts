import { z } from "zod";

const trimmedNonEmpty = z
  .string()
  .transform((s) => s.trim())
  .refine((s) => s.length > 0, { message: "Value cannot be empty or whitespace" });

export const createRoomSchema = z.object({
  playerName: trimmedNonEmpty
});

export const joinRoomSchema = z.object({
  playerName: trimmedNonEmpty
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startSchema = z.object({
  participantId: z.string()
});

export const guessSchema = z.object({
  participantId: z.string(),
  guess: trimmedNonEmpty
});

export const restartSchema = z.object({
  participantId: z.string()
});

export const strokePointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const strokeSchema = z.object({
  participantId: z.string(),
  points: z.array(strokePointSchema),
  color: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
