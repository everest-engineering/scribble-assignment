import { z } from "zod";

const trimmedName = z.preprocess(
  (val) => (typeof val === "string" ? val.trim() : val),
  z.string().min(1, "Name is required").max(30, "Name must be 30 characters or less")
);

export const createRoomSchema = z.object({
  playerName: trimmedName.optional().default("Player")
});

export const joinRoomSchema = z.object({
  playerName: trimmedName.optional().default("Player")
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const leaveRoomSchema = z.object({
  participantId: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  text: z.string().trim().min(1, "Guess cannot be empty").max(100, "Guess must be 100 characters or less")
});

export const restartGameSchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
