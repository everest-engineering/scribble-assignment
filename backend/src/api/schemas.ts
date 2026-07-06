import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1)
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const submitGuessSchema = z.object({
  guess: z.string().trim().min(1, "Guess cannot be empty"),
  participantId: z.string().min(1)
});

export const canvasStrokeSchema = z.object({
  type: z.literal("stroke"),
  stroke: z.object({
    points: z.array(z.object({
      x: z.number(),
      y: z.number()
    })).min(1, "Stroke must have at least one point")
  })
});

export const canvasClearSchema = z.object({
  type: z.literal("clear")
});

export const canvasBodySchema = z.discriminatedUnion("type", [
  canvasStrokeSchema,
  canvasClearSchema
]);

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
