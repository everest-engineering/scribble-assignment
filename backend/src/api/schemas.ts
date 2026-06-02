import { z } from "zod";

const trimmedName = z.string()
  .trim()
  .min(1, "Name cannot be empty");

export const createRoomSchema = z.object({
  playerName: trimmedName.optional()
});

export const joinRoomSchema = z.object({
  playerName: trimmedName.optional()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameBodySchema = z.object({
  participantId: z.string()
});

const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const drawStrokeBodySchema = z.object({
  participantId: z.string(),
  stroke: z.object({
    points: z.array(pointSchema)
  })
});

export const actionBodySchema = z.object({
  participantId: z.string()
});

export const guessBodySchema = z.object({
  participantId: z.string(),
  text: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
