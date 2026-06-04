import { z } from "zod";

const roomCodeInputSchema = z
  .string()
  .trim()
  .min(1, "Room code is required")
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{4}$/, "Invalid room code"));

const participantIdSchema = z.string().trim().min(1, "Participant id is required");
const playerNameSchema = z.string().trim().min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeInputSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: participantIdSchema
});

export const leaveRoomSchema = z.object({
  participantId: participantIdSchema
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
