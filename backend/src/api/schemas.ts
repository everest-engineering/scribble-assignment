import { z } from "zod";

const playerNameSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "Player name is required" });

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

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
