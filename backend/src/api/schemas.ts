import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name invalid").max(20, "Player name invalid")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name invalid").max(20, "Player name invalid")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().length(4).regex(/^[A-Z2-9]+$/)
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const submitGuessSchema = z.object({
  guess: z.string().trim().min(1, "Guess cannot be empty")
});

export const updateCanvasSchema = z.object({
  drawingEvents: z.any()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
