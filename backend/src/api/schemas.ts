import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name cannot be empty")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name cannot be empty")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().min(1, "Room code is required")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameParamsSchema = z.object({
  code: z.string().min(1, "Room code is required")
});

export const startGameBodySchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export const guessBodySchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  text: z.string().trim().min(1, "Guess cannot be empty")
});

export const drawBodySchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  drawingData: z.string()
});

export const clearDrawBodySchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export const restartBodySchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export const endRoundBodySchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
