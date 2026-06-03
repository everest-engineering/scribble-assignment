import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "playerName is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "playerName is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const joinRoomParamsSchema = z.object({
  code: z.string()
    .min(1, "Room code is required")
    .refine((s) => /^[A-Za-z0-9]+$/.test(s), { message: "Room code must contain only letters and numbers" })
    .transform((s) => s.toUpperCase())
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string().uuid("participantId must be a valid UUID")
});

export const strokeSchema = z.object({
  participantId: z.string(),
  stroke: z.object({
    points: z.array(z.object({ x: z.number(), y: z.number() })).min(1, "Stroke must have at least one point"),
    color: z.string().optional(),
    lineWidth: z.number().positive().optional()
  })
});

export const clearSchema = z.object({
  participantId: z.string()
});

export const guessSchema = z.object({
  participantId: z.string(),
  text: z.string()
});

export const endRoomSchema = z.object({
  participantId: z.string()
});

export const restartRoomSchema = z.object({
  participantId: z.string()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
