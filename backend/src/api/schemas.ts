import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required.")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required.")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1, "Room code is required.")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const participantActionSchema = z.object({
  participantId: z.string().trim().min(1, "Participant is required.")
});

const drawingPointSchema = z.object({
  x: z.number(),
  y: z.number()
});

const drawingPathSchema = z.object({
  points: z.array(drawingPointSchema),
  color: z.string().trim().min(1).default("#111827"),
  width: z.number().positive().default(4)
});

export const drawingDataSchema = z.object({
  paths: z.array(drawingPathSchema)
});

export const updateDrawingSchema = participantActionSchema.extend({
  drawing: drawingDataSchema
});

export const submitGuessSchema = participantActionSchema.extend({
  text: z.string().trim().min(1, "Guess is required.")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
