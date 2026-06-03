import { z } from "zod";

const playerNameField = z
  .string({ required_error: "Enter your name" })
  .transform((value) => value.trim())
  .refine((value) => value.length > 0, { message: "Enter your name" });

export const createRoomSchema = z.object({
  playerName: playerNameField
});

export const joinRoomSchema = z.object({
  playerName: playerNameField
});

export const roomCodeParamsSchema = z.object({
  code: z
    .string({ required_error: "Enter a room code" })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Enter a room code" })
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1)
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  text: z
    .string({ required_error: "Enter a guess" })
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, { message: "Enter a guess" })
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
