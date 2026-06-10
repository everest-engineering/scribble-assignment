import { z } from "zod";

const nameValidationMessage =
  "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores";

export const playerNameSchema = z
  .string()
  .trim()
  .min(1, nameValidationMessage)
  .max(15, nameValidationMessage)
  .regex(/^[A-Za-z0-9 _-]+$/, nameValidationMessage);

export const createRoomSchema = z.object({
  playerName: playerNameSchema.optional()
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema.optional()
});

export const roomCodeParamsSchema = z.object({
  code: z.string().length(4).regex(/^[A-Z0-9]+$/)
});

export const startGameSchema = z.object({
  participantId: z.string()
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
