import { z } from "zod";

const requiredTrimmedString = (message: string) =>
  z
    .string({
      required_error: message,
      invalid_type_error: message
    })
    .trim()
    .min(1, message);

const participantIdSchema = requiredTrimmedString("Participant id is required");

export const createRoomSchema = z.object({
  playerName: requiredTrimmedString("Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: requiredTrimmedString("Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: requiredTrimmedString("Room code is required").regex(
    /^[A-Za-z0-9]{4}$/,
    "Room code must be 4 letters or numbers"
  )
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const participantActionSchema = z.object({
  participantId: participantIdSchema
});

export const drawingSchema = participantActionSchema.extend({
  drawingDataUrl: z
    .string({
      invalid_type_error: "Drawing data must be a data URL"
    })
    .startsWith("data:image/png;base64,", "Drawing data must be a PNG data URL")
    .max(1_000_000, "Drawing data is too large")
    .nullable()
});

export const guessSchema = participantActionSchema.extend({
  guess: requiredTrimmedString("Guess is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
