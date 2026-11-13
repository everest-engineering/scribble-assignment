import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(32, { message: "Name must be 32 characters or less" })
});

export const joinRoomSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(32, { message: "Name must be 32 characters or less" })
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .length(4, { message: "Room code must be exactly 4 characters" })
    .regex(/^[A-Z0-9]{4}$/, { message: "Room code must contain only letters and numbers" })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().trim().min(1, { message: "Participant ID is required" })
});

export const leaveRoomSchema = z.object({
  participantId: z.string().trim().min(1, { message: "Participant ID is required" })
});

export const drawingSchema = z.object({
  drawingData: z.string()
});

export const guessSchema = z.object({
  participantId: z.string().trim().min(1, { message: "Participant ID is required" }),
  guessText: z
    .string()
    .trim()
    .min(1, { message: "Guess text must not be empty" })
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
