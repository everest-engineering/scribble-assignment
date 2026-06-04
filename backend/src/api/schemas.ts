import { z } from "zod";

const playerNameSchema = z
  .string()
  .trim()
  .min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const guessSchema = z.object({
  participantId: z.string(),
  guess: z
    .string()
    .trim()
    .min(1, "Guess is required")
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .length(4, "Room code must be 4 characters")
    .regex(/^[A-Z0-9]+$/i, "Room code contains invalid characters")
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