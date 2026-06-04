import { z } from "zod";

export const playerNameSchema = z.string().trim().min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: z.string().min(1, "Room code is required")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1)
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1),
  text: z.string().trim().min(1, "Guess cannot be empty")
});

export const drawStrokeSchema = z.object({
  participantId: z.string().min(1),
  stroke: z.object({
    points: z.array(z.object({
      x: z.number(),
      y: z.number()
    })),
    color: z.string(),
    width: z.number()
  })
});

export const clearCanvasSchema = z.object({
  participantId: z.string().min(1)
});

export const restartGameSchema = z.object({
  participantId: z.string().min(1)
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
