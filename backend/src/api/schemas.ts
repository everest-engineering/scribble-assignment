import { z } from "zod";

const playerNameSchema = z.string().trim().min(1, {
  message: "Player name is required"
});

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const startGameSchema = z.object({
  participantId: z.string().trim().min(1, {
    message: "Participant is required"
  })
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, { message: "Room code is required" })
    .transform((value) => value.toUpperCase())
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
