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

export const startRoomSchema = z.object({
  participantId: z.string()
});

export const guessSchema = z.object({
  participantId: z.string(),
  guessText: z.string()
});

export const endRoomSchema = z.object({
  participantId: z.string()
});

export const restartRoomSchema = z.object({
  participantId: z.string()
});

const CANVAS_DATA_MAX = 400_000;
const CANVAS_DATA_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;

export const canvasSchema = z.object({
  participantId: z.string(),
  canvasData: z
    .string()
    .max(CANVAS_DATA_MAX, "Canvas data exceeds maximum allowed size")
    .regex(CANVAS_DATA_RE, "canvasData must be a valid base64 image data URL")
    .nullable()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
