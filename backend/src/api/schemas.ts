import { z } from "zod";

// Trim surrounding whitespace (internal spaces preserved). Emptiness is checked
// in the route so we can return a clear, specific message (FR-009, FR-010).
const playerNameSchema = z.string().trim().optional();

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const startRoomSchema = z.object({
  participantId: z.string()
});

// Guess text is trimmed (FR-002); emptiness is checked in the route so it can
// return a specific message (FR-003).
export const submitGuessSchema = z.object({
  participantId: z.string(),
  text: z.string().trim()
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
