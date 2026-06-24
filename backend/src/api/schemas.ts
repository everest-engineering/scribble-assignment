import { z } from "zod";

const roomCodePattern = /^[A-Z0-9]{4}$/;

export const createRoomSchema = z.object({
  playerName: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => value.length > 0, { message: "Player name is required" })
});

export const joinRoomSchema = z.object({
  playerName: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? "")
    .refine((value) => value.length > 0, { message: "Player name is required" })
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .transform((value) => value.toUpperCase())
    .refine((value) => roomCodePattern.test(value), {
      message: "Room code must be exactly 4 characters"
    })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1)
});

export const participantActionSchema = z.object({
  participantId: z.string().min(1)
});

const drawingPointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const addStrokeSchema = z.object({
  participantId: z.string().min(1),
  stroke: z.object({
    id: z.string().min(1),
    color: z.string().min(1),
    width: z.number().positive(),
    points: z.array(drawingPointSchema).min(1)
  })
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  text: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
