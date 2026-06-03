import { z } from "zod";

const playerName = z
  .string({ required_error: "Player name is required" })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, "Player name is required")
  .refine((value) => value.length <= 24, "Player name must be 24 characters or fewer");

export const createRoomSchema = z.object({
  playerName
});

export const joinRoomSchema = z.object({
  playerName
});

const roomCode = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .refine((value) => /^[A-Z0-9]{4}$/.test(value), "Enter a valid 4-character room code");

export const roomCodeParamsSchema = z.object({
  code: roomCode
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const restartRoomSchema = startRoomSchema;

const strokeSchema = z.object({
  color: z.string(),
  width: z.number(),
  points: z.array(z.object({ x: z.number(), y: z.number() }))
});

export const canvasUpdateSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  strokes: z.array(strokeSchema)
});

export const guessSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  text: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, "Guess cannot be empty")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
