import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
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

export const renameBodySchema = z.object({
  participantId: z.string(),
  name: z.string()
});

export const disbandBodySchema = z.object({
  participantId: z.string()
});

export const strokePointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const strokeSchema = z.object({
  points: z.array(strokePointSchema),
  color: z.string(),
  width: z.number()
});

export const guessBodySchema = z.object({
  participantId: z.string(),
  text: z.string()
});

export const canvasStrokesSchema = z.object({
  participantId: z.string(),
  strokes: z.array(strokeSchema)
});

export const canvasClearBodySchema = z.object({
  participantId: z.string()
});

export const roundEndBodySchema = z.object({
  participantId: z.string()
});

export const restartBodySchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
