import { z } from "zod";

export const playerNameSchema = z
  .union([z.string(), z.undefined()])
  .transform((value) => (value ?? "").trim())
  .pipe(
    z
      .string()
      .min(1, "Player name is required")
      .max(24, "Player name must be 24 characters or fewer")
  );

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const appendStrokeSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  points: z.array(pointSchema).min(2).max(250),
  color: z.string().optional(),
  width: z.number().positive().optional()
});

export const clearStrokesSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  text: z.string()
});

export const restartRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
