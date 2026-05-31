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
