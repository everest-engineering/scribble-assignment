import { z } from "zod";

const ROOM_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

const playerNameSchema = z
  .string({
    required_error: "Enter a player name"
  })
  .trim()
  .min(1, "Enter a player name");

const roomCodeSchema = z
  .string({
    required_error: "Enter a room code"
  })
  .trim()
  .superRefine((value, context) => {
    if (!value) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a room code"
      });
      return;
    }

    if (!ROOM_CODE_PATTERN.test(value.toUpperCase())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid 4-character room code"
      });
    }
  })
  .transform((value) => value.toUpperCase());

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z
    .string({
      required_error: "Participant id is required"
    })
    .trim()
    .min(1, "Participant id is required")
});

export const restartRoomSchema = z.object({
  participantId: z
    .string({
      required_error: "Participant id is required"
    })
    .trim()
    .min(1, "Participant id is required")
});

export const submitGuessSchema = z.object({
  participantId: z
    .string({
      required_error: "Participant id is required"
    })
    .trim()
    .min(1, "Participant id is required"),
  guessText: z.string({
    required_error: "Enter a guess"
  })
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
