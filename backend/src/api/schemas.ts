import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name cannot be empty")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name cannot be empty")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1, "Room code cannot be empty")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const updateDrawingSchema = z.object({
  drawingData: z.string()
});

export const submitGuessSchema = z.object({
  guessText: z.string().trim().min(1, "Please enter a guess.")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
