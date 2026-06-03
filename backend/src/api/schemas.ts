import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const startRoomRequestSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const updateCanvasSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  canvasDataUrl: z.string().min(1, "canvasDataUrl is required")
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  text: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
