import { z } from "zod";

// Accept optional playerName, but if provided trim and require at least one character
const optionalTrimmedName = z
  .string()
  .optional()
  .transform((v) => (v === undefined ? undefined : v.trim()))
  .refine((v) => v === undefined || v.length > 0, {
    message: "Please enter a name."
  });

export const createRoomSchema = z.object({
  playerName: optionalTrimmedName
});

export const joinRoomSchema = z.object({
  playerName: optionalTrimmedName
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: z.string()
});

export const guessPayloadSchema = z.object({
  participantId: z.string(),
  text: z.string()
});

export const canvasEventSchema = z.object({
  participantId: z.string(),
  event: z.object({
    type: z.enum(["draw", "clear"]),
    payload: z.any().optional()
  })
});

// Round summary schema returned by the API
export const roundSummarySchema = z.object({
  word: z.string().optional(),
  drawerId: z.string().optional(),
  finalScores: z
    .array(
      z.object({ participantId: z.string(), score: z.number().optional() })
    )
    .optional(),
  guesses: z
    .array(
      z.object({
        playerId: z.string(),
        textTrimmed: z.string(),
        timestamp: z.string(),
        isCorrect: z.boolean()
      })
    )
    .optional(),
  endedAt: z.string().optional()
});

export const restartRoomSchema = z.object({
  participantId: z.string()
});

export const reconnectSchema = z.object({
  participantId: z.string()
});
export class HttpError extends Error {
  statusCode: number;
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const ERR_NAME_REQUIRED = "ERR_NAME_REQUIRED";
export const ERR_NO_WORDS = "ERR_NO_WORDS";
export const ERR_GUESS_REQUIRED = "ERR_GUESS_REQUIRED";
export const ERR_GUESS_TOO_LONG = "ERR_GUESS_TOO_LONG";
