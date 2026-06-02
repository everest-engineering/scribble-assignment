import { z } from "zod";

export const ROOM_CODE_REGEX = /^[A-Z2-9]{4}$/;

export const playerNameSchema = z
  .string()
  .trim()
  .min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .transform((value) => value.toUpperCase())
    .refine((value) => ROOM_CODE_REGEX.test(value), {
      message: "Invalid room code format"
    })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const participantActionSchema = z.object({
  participantId: z.string().uuid()
});

const strokePointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const strokeSchema = z.object({
  participantId: z.string().uuid(),
  stroke: z.object({
    points: z.array(strokePointSchema).min(1),
    color: z.string(),
    width: z.number().positive()
  })
});

export const guessSchema = z.object({
  participantId: z.string().uuid(),
  guess: z.string().trim().min(1, "Guess cannot be empty")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
