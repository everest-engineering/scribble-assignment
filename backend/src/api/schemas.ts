import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required").max(20, "Player name is too long")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required").max(20, "Player name is too long")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID required")
});

export const selectWordSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID required"),
  word: z.string().trim().min(1, "Word required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
