import { z } from "zod";

export const playerNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name must be 50 characters or less")
  .transform((s) => s.trim());

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .min(1, "Room code is required")
    .transform((s) => s.trim().toUpperCase())
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export const wordSelectionSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  word: z.string().min(1, "Word is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
