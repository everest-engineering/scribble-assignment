import { z } from "zod";

const playerNameSchema = z.string().trim().min(1).max(16).regex(/^[a-zA-Z0-9]+$/);

export const createRoomSchema = z.object({
  playerName: playerNameSchema.optional().default("Player")
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema.optional().default("Player")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1)
});

export const startGameSchema = z.object({
  participantId: z.string()
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
