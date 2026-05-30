import { z } from "zod";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../models/game.js";

const playerNameSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "Player name is required" });

const guessTextSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "Guess is required" });

const pointSchema = z.object({
  x: z.number().finite().min(0).max(CANVAS_WIDTH),
  y: z.number().finite().min(0).max(CANVAS_HEIGHT)
});

const strokeInputSchema = z.object({
  points: z.array(pointSchema).min(2),
  color: z.string().optional(),
  width: z.number().positive().optional()
});

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1)
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const addStrokeSchema = z.object({
  participantId: z.string().min(1),
  stroke: strokeInputSchema
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1)
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  guessText: guessTextSchema
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
