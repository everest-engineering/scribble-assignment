import { z } from "zod";

const roomCodeSchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{4}$/, "Room code must be 4 characters"));

const playerNameSchema = z.string().trim().min(1, "Player name is required").max(40);
const participantIdSchema = z.string().trim().min(1, "Participant ID is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: participantIdSchema.optional()
});

export const startRoomSchema = z.object({
  participantId: participantIdSchema
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
