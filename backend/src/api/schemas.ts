import { z } from "zod";

const roomCodeInputSchema = z
  .string()
  .trim()
  .min(1, "Room code is required")
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{4}$/, "Invalid room code"));

const participantIdSchema = z.string().trim().min(1, "Participant id is required");
const playerNameSchema = z.string().trim().min(1, "Player name is required");
const drawingPointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite()
});

const strokeSchema = z.object({
  points: z.array(drawingPointSchema).min(1, "Stroke must include at least one point"),
  color: z.string().trim().min(1),
  lineWidth: z.number().positive()
});

const guessEntrySchema = z.object({
  participantId: participantIdSchema,
  participantName: playerNameSchema,
  guess: z.string().trim().min(1),
  isCorrect: z.boolean()
});

const participantSchema = z.object({
  id: participantIdSchema,
  name: playerNameSchema,
  joinedAt: z.string().min(1),
  role: z.enum(["drawer", "guesser"]).optional(),
  score: z.number(),
  hasGuessedCorrectly: z.boolean()
});

const roomSnapshotSchema = z.object({
  code: roomCodeInputSchema,
  status: z.enum(["lobby", "game"]),
  hostParticipantId: participantIdSchema,
  currentDrawerId: z.string().nullable(),
  participants: z.array(participantSchema),
  drawing: z.array(strokeSchema),
  guessHistory: z.array(guessEntrySchema),
  availableWords: z.array(z.string()),
  currentWord: z.string().optional()
});

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: roomCodeInputSchema
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startRoomSchema = z.object({
  participantId: participantIdSchema
});

export const leaveRoomSchema = z.object({
  participantId: participantIdSchema
});

export const drawingSubmissionSchema = z.object({
  participantId: participantIdSchema,
  points: z.array(drawingPointSchema).min(1, "Stroke must include at least one point")
});

export const clearCanvasSchema = z.object({
  participantId: participantIdSchema
});

export const guessSubmissionSchema = z.object({
  participantId: participantIdSchema,
  guess: z.string().trim().min(1, "Guess is required")
});

export const roomSnapshotResponseSchema = z.object({
  room: roomSnapshotSchema
});

export const roomSessionResponseSchema = z.object({
  participantId: participantIdSchema,
  room: roomSnapshotSchema
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
