import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Room code is required")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const participantActionSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export const strokePointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1)
});

export const strokeSchema = z.object({
  points: z.array(strokePointSchema).min(1)
});

export const addStrokeSchema = z.object({
  participantId: z.string().min(1),
  stroke: strokeSchema
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guess: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function mapStoreError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  const message = error instanceof Error ? error.message : "Unexpected error";

  if (message === "Player name is required" || message === "Guess is required") {
    return new HttpError(400, message);
  }

  if (
    message === "Only the host can start the game" ||
    message === "Only the host can restart the game" ||
    message === "Only the drawer can draw" ||
    message === "Only the drawer can clear the canvas" ||
    message === "Drawer cannot guess"
  ) {
    return new HttpError(403, message);
  }

  if (
    message === "Unable to load room" ||
    message === "Participant not found"
  ) {
    return new HttpError(404, message);
  }

  if (
    message === "Game already started" ||
    message === "At least 2 players are required to start" ||
    message === "Game is not in progress" ||
    message === "Game is not in result state"
  ) {
    return new HttpError(400, message);
  }

  return new HttpError(500, message);
}
