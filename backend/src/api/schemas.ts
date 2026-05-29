import { z } from "zod";

export const playerNameSchema = z.string()
  .trim()
  .min(1, "Name cannot be empty or whitespace")
  .max(20, "Name must be 20 characters or less");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1, "Room code cannot be empty")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string()
});

export const strokeSchema = z.object({
  participantId: z.string(),
  strokes: z.array(z.object({
    paths: z.array(z.object({
      x: z.number(),
      y: z.number()
    })),
    strokeColor: z.string(),
    strokeWidth: z.number(),
    drawMode: z.boolean(),
    startTimestamp: z.number().optional(),
    endTimestamp: z.number().optional()
  }))
});

export const guessSchema = z.object({
  participantId: z.string(),
  text: z.string().trim().min(1, "Guess cannot be empty")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
