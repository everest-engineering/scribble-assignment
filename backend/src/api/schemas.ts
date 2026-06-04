import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional().transform(val => val ? val.trim() : undefined)
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional().transform(val => val ? val.trim() : undefined)
});

export const roomCodeParamsSchema = z.object({
  code: z.string().min(1, "Room code cannot be empty")
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
