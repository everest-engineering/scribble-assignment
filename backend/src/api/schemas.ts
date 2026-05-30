import { z } from "zod";

export const playerNameSchema = z.string().trim().min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const drawingDataSchema = z.object({
  participantId: z.string(),
  drawingData: z.string()
});

export const guessSubmissionSchema = z.object({
  participantId: z.string(),
  text: z.string().trim().min(1, "Guess cannot be empty")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
