import { z } from "zod";

const trimmedNonEmptyString = z.string().trim().min(1, { message: "Player name is required" }).max(20, { message: "Player name must be 20 characters or fewer" });

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

const strokePointSchema = z.object({
  x: z.number(),
  y: z.number()
});

const drawingStrokeSchema = z.object({
  id: z.string(),
  points: z.array(strokePointSchema),
  color: z.string(),
  width: z.number()
});

export const drawStrokesSchema = z.object({
  participantId: z.string(),
  strokes: z.array(drawingStrokeSchema)
});

export const clearCanvasSchema = z.object({
  participantId: z.string()
});

export const restartGameSchema = z.object({
  playerId: z.string()
});

export const claimHostSchema = z.object({
  participantId: z.string()
});

export const skipRoundSchema = z.object({
  playerId: z.string()
});

export const suggestSkipSchema = z.object({
  participantId: z.string()
});

export const leaveRoomSchema = z.object({
  participantId: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  guess: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
