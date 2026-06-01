import { z } from "zod";

const trimmedNonEmpty = () =>
  z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, { message: "playerName is required" });

export const createRoomSchema = z.object({
  playerName: trimmedNonEmpty(),
});

export const joinRoomSchema = z.object({
  playerName: trimmedNonEmpty(),
});

export const roomCodeParamsSchema = z.object({
  code: z.string(),
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional(),
});

export const startRoomSchema = z.object({
  participantId: z.string(),
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
