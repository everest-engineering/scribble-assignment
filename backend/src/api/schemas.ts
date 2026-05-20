import { z } from "zod";

const playerNameSchema = z.string().trim().min(1).max(16).regex(/^[a-zA-Z0-9]+$/);

export const createRoomSchema = z.object({
  playerName: playerNameSchema.optional().default("Player")
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema.optional().default("Player")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1)
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const drawStrokesSchema = z.object({
  participantId: z.string().min(1, "Participant ID required"),
  strokes: z.array(
    z.object({
      points: z
        .array(z.object({ x: z.number(), y: z.number() }))
        .min(2, "Each stroke must have at least 2 points"),
      color: z.string(),
      width: z.number()
    })
  )
});

export const restartGameSchema = z.object({
  participantId: z.string()
});

export const guessSubmissionSchema = z.object({
  participantId: z.string().min(1, "Participant ID required"),
  text: z.string().trim().min(1, "Guess cannot be empty").max(50, "Guess must be 50 characters or fewer")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
