import { z } from "zod";
import { STARTER_WORDS } from "../seed/starterData.js";

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
});

const strokeSchema = z.object({
  points: z.array(pointSchema).min(1, "At least one point is required"),
  color: z.string().trim().min(1, "Stroke color is required"),
  lineWidth: z.number().finite().positive("Line width must be positive")
});

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().length(4, "Room code must be 4 characters")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().trim().min(1, "Participant id is required"),
  secretWord: z.enum(STARTER_WORDS)
});

export const restartRoomSchema = z.object({
  participantId: z.string().trim().min(1, "Participant id is required")
});

export const drawCanvasSchema = z.object({
  participantId: z.string().trim().min(1, "Participant id is required"),
  stroke: strokeSchema
});

export const clearCanvasSchema = z.object({
  participantId: z.string().trim().min(1, "Participant id is required")
});

export const submitGuessSchema = z.object({
  participantId: z.string().trim().min(1, "Participant id is required"),
  guessText: z.string().trim().min(1, "Guess text is required")
});

export function normalizeGuessText(text: string) {
  return text.trim().toLowerCase();
}

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
