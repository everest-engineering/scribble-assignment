import { z } from "zod";
import { HttpError } from "../models/game.js";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name cannot be empty")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name cannot be empty")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const submitGuessSchema = z.object({
  participantId: z.string(),
  text: z.string().trim().min(1, "Guess cannot be empty")
});

export const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const strokeSchema = z.object({
  points: z.array(pointSchema)
});

export const saveStrokesSchema = z.object({
  participantId: z.string(),
  strokes: z.array(strokeSchema)
});
