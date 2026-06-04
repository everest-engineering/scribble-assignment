import { z } from "zod";

const normalizedName = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .refine((value) => value.length > 0, {
    message: "playerName is required"
  });

export const createRoomSchema = z.object({
  playerName: normalizedName
});

export const joinRoomSchema = z.object({
  playerName: normalizedName
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const guessSchema = z.object({
  text: z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .refine((value) => value.length > 0, { message: "text is required" })
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
