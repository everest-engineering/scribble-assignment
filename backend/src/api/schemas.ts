import { z } from "zod";

const nameValidationMessage =
  "Name must be non-empty and 1-15 characters: letters, numbers, spaces, hyphens, underscores";

export const playerNameSchema = z
  .string()
  .trim()
  .min(1, nameValidationMessage)
  .max(15, nameValidationMessage)
  .regex(/^[A-Za-z0-9 _-]+$/, nameValidationMessage);

export const createRoomSchema = z.object({
  playerName: playerNameSchema.optional()
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema.optional()
});

export const roomCodeParamsSchema = z.object({
  code: z.string().length(4).regex(/^[A-Z0-9]+$/)
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const restartGameSchema = z.object({
  participantId: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const playerIdQuerySchema = z.object({
  playerId: z.string().min(1)
});

export const canvasActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("stroke"),
    points: z.array(z.object({ x: z.number(), y: z.number() })).min(1),
    color: z.string(),
    width: z.number().positive(),
    timestamp: z.string().optional()
  }),
  z.object({
    type: z.literal("clear"),
    timestamp: z.string().optional()
  })
]);

export const guessSubmissionSchema = z.object({
  text: z.string().trim().min(1, "Guess cannot be empty").max(100, "Guess cannot exceed 100 characters")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
