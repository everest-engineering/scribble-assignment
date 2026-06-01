import { z } from "zod";

const trimmedNonEmptyString = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "Name is required" });

export const createRoomSchema = z.object({
  playerName: trimmedNonEmptyString
});

export const joinRoomSchema = z.object({
  playerName: trimmedNonEmptyString
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string()
    .transform((value) => value.trim().toUpperCase())
    .refine((value) => value.length > 0, { message: "Room code is required" })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().uuid()
});

export const startGameQuerySchema = z.object({
  participantId: z.string().uuid()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
