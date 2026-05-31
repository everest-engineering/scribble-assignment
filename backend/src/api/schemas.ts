import { z } from "zod";

export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`);

export const playerNameSchema = z.string().trim().min(1, "Player name is required");

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
    .refine((value) => ROOM_CODE_PATTERN.test(value), {
      message: "Invalid room code format"
    })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1)
});

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
});

export const strokeSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1),
  width: z.number().positive(),
  points: z.array(pointSchema).min(1)
});

export const appendStrokeSchema = z.object({
  participantId: z.string().min(1),
  stroke: strokeSchema
});

export const clearDrawingSchema = z.object({
  participantId: z.string().min(1)
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guess: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
