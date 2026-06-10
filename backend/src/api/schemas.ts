import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string({ required_error: "Player name is required" })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: "Player name cannot be empty" })
});

export const joinRoomSchema = z.object({
  playerName: z.string({ required_error: "Player name is required" })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: "Player name cannot be empty" })
});

export const startRoomSchema = z.object({
  participantId: z.string({ required_error: "participantId is required" })
    .min(1, "participantId cannot be empty")
});

export const restartRoomSchema = z.object({
  participantId: z.string({ required_error: "participantId is required" })
    .min(1, "participantId cannot be empty")
});

export const canvasUpdateSchema = z.object({
  participantId: z.string({ required_error: "participantId is required" })
    .min(1, "participantId cannot be empty"),
  strokes: z.array(
    z.object({
      points: z.array(z.object({ x: z.number(), y: z.number() }))
    })
  )
});

export const guessSubmitSchema = z.object({
  participantId: z.string({ required_error: "participantId is required" })
    .min(1, "participantId cannot be empty"),
  guessText: z.string({ required_error: "guessText is required" })
    .min(1, "guessText cannot be empty")
});

export const roomCodeParamsSchema = z.object({
  code: z.string({ required_error: "Room code is required" })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, { message: "Room code cannot be empty" })
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
