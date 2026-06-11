import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, { message: "Player name is required" })
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, { message: "Player name is required" })
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1)
});

export const startGameSchema = z.object({
  participantId: z.string().trim().min(1)
});

export const restartGameSchema = z.object({
  participantId: z.string().trim().min(1)
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
