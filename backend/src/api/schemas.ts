import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
});

// Matches the code shape produced by generateCode: 4 chars from the
// ambiguity-free alphabet (no I, O, 0, 1). Case-insensitive; normalized upstream.
export const roomCodeParamsSchema = z.object({
  code: z.string().regex(/^[A-HJ-NP-Za-hj-np-z2-9]{4}$/, "Invalid room code")
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
