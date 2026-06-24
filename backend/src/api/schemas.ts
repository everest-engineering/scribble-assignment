import { z } from "zod";

const roomCodePattern = /^[A-Z0-9]{4}$/;

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .transform((value) => value.toUpperCase())
    .refine((value) => roomCodePattern.test(value), {
      message: "Room code must be exactly 4 characters"
    })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1)
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
