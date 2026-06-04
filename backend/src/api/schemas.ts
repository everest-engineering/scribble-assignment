import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z
    .string({ required_error: "Username cannot be empty or only whitespace." })
    .trim()
    .min(1, "Username cannot be empty or only whitespace.")
});

export const joinRoomSchema = z.object({
  playerName: z
    .string({ required_error: "Username cannot be empty or only whitespace." })
    .trim()
    .min(1, "Username cannot be empty or only whitespace.")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().min(1, "Room code cannot be empty")
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

export const updateCanvasSchema = z.object({
  drawingData: z.string()
});

export const submitGuessSchema = z.object({
  guessText: z
    .string({ required_error: "Guess cannot be empty." })
    .trim()
    .min(1, "Guess cannot be empty.")
});
