import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().optional()
});

export const joinRoomSchema = z.object({
  playerName: z.string().optional()
});

export const roomCodeParamsSchema = z.object({
  code: z.string().min(1)
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const participantActionSchema = z.object({
  participantId: z.string().min(1)
});

export const guessSchema = z.object({
  participantId: z.string().min(1),
  text: z.string()
});

export const drawingSchema = z.object({
  participantId: z.string().min(1),
  strokes: z.array(
    z.object({
      color: z.string(),
      width: z.number(),
      points: z.array(
        z.object({
          x: z.number(),
          y: z.number()
        })
      )
    })
  )
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
