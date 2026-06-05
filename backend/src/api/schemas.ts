import { z } from "zod";

const playerNameSchema = z
  .string({ required_error: "Player name is required" })
  .trim()
  .min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1, "Room code is required")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

const participantIdSchema = z
  .string({ required_error: "participantId is required" })
  .trim()
  .min(1, "participantId is required");

export const startGameSchema = z.object({
  participantId: participantIdSchema
});

export const guessSchema = z.object({
  participantId: participantIdSchema,
  text: z.string({ required_error: "Guess cannot be empty" }).trim().min(1, "Guess cannot be empty")
});

export const restartSchema = z.object({
  participantId: participantIdSchema
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
