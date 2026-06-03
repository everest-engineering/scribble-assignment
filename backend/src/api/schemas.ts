import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional(),
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional(),
});

export const roomCodeParamsSchema = z.object({
  code: z.string(),
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional(),
});

export const startRoomSchema = z.object({});

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const updateCanvasSchema = z.object({
  participantId: z.string(),
  strokes: z.array(z.array(pointSchema)),
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  text: z.string(),
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
