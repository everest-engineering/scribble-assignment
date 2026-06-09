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

const pointSchema = z.object({
  x: z.number().finite().min(0).max(1),
  y: z.number().finite().min(0).max(1)
});

const strokeSchema = z.object({
  points: z.array(pointSchema).min(2, "Stroke must have at least 2 points"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex string"),
  width: z.number().finite().min(0.001).max(1)
});

export const strokesSubmissionSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  strokes: z.array(strokeSchema).min(1).max(20, "Maximum 20 strokes per submission")
});

export const guessSubmissionSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  text: z
    .string()
    .min(1, "Guess is required")
    .max(100, "Guess must be 100 characters or less")
    .transform((s) => s.trim())
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
