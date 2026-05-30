import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required").max(20, "Player name is too long")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required").max(20, "Player name is too long")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID required")
});

export const selectWordSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID required"),
  word: z.string().trim().min(1, "Word required")
});

export const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const strokeSchema = z.object({
  id: z.string(),
  color: z.string(),
  brushSize: z.number(),
  points: z.array(pointSchema),
  isComplete: z.boolean()
});

export const addStrokeSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID required"),
  stroke: strokeSchema
});

export const addGuessSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID required"),
  text: z.string().trim().min(1, "Guess cannot be empty").max(50, "Guess too long")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
