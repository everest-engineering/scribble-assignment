import { z } from "zod";

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name cannot be empty").max(32, "Name cannot exceed 32 characters")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Name cannot be empty").max(32, "Name cannot exceed 32 characters")
});

export const roomCodeParamsSchema = z.object({
  code: z.string().regex(/^[a-zA-Z0-9]{6}$/, "Room code must be exactly 6 alphanumeric characters")
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export const submitDrawingSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  action: z.object({
    type: z.enum(["DRAW", "CLEAR"]),
    data: z.any().optional(),
    timestamp: z.number()
  })
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  text: z.string().trim().min(1, "Guess cannot be empty").max(50, "Guess is too long")
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
