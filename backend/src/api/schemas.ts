import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required").max(20)
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name is required").max(20)
});

export const startGameSchema = z.object({
  participantId: z.string().uuid()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const submitGuessSchema = z.object({
  participantId: z.string().uuid(),
  text: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
