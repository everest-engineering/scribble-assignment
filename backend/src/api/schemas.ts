import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1)
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1)
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1)
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1)
});

export const guessSchema = z.object({
  participantId: z.string().min(1),
  text: z.string().trim().min(1)
});

export const drawingSchema = z.object({
  participantId: z.string().min(1),
  drawing: z.string().nullable()
});

export const endRoomSchema = z.object({
  participantId: z.string().min(1)
});

export const restartRoomSchema = z.object({
  participantId: z.string().min(1)
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
