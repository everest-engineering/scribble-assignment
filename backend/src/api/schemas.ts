import { z } from "zod";

const nonEmptyName = z.string().min(1, "Display name is required").transform(
  (value) => value.trim()
).refine(
  (value) => value.length > 0,
  "Display name cannot be only whitespace"
);

export const createRoomSchema = z.object({
  playerName: nonEmptyName
});

export const joinRoomSchema = z.object({
  playerName: nonEmptyName
});

export const roomCodeParamsSchema = z.object({
  code: z.string().max(4, "Room code must be at most 4 characters")
});

export const startGameParamsSchema = z.object({
  code: z.string().max(4, "Room code must be at most 4 characters")
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
