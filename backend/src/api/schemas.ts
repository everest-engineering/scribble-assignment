import { z } from "zod";

/** Player names are finalised in feature group 2 (trim + reject empty/whitespace). */
export const createRoomSchema = z.object({
  playerName: z.string()
});

export const joinRoomSchema = z.object({
  playerName: z.string()
});

const roomCode = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .refine((value) => /^[A-Z0-9]{4}$/.test(value), "Enter a valid 4-character room code");

export const roomCodeParamsSchema = z.object({
  code: roomCode
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
