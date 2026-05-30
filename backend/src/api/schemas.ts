import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().regex(/^[A-Z2-9]{4}$/, "Room code must be 4 uppercase characters")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomBodySchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID")
});

export const submitGuessSchema = z.object({
  guesserId: z.string().uuid("guesserId must be a valid UUID"),
  text: z.string().trim().min(1, "Guess text is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
