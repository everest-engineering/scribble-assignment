import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional(),
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional(),
});

export const roomCodeParamsSchema = z.object({
  code: z.string(),
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional(),
});

export class HttpError extends Error {
  statusCode: number;
  payload?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    payload?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.payload = payload;
  }
}
