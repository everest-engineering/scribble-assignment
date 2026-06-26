import { z } from "zod";

const trimmedNonEmptyString = z.string().trim().min(1, { message: "Player name is required" });

export const createRoomSchema = z.object({
  playerName: trimmedNonEmptyString
});

export const joinRoomSchema = z.object({
  playerName: trimmedNonEmptyString
});

export const startGameSchema = z.object({
  playerId: z.string({ message: "Player ID is required" })
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
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
