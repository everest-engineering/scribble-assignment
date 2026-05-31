import { z } from "zod";

export const errorCodeSchema = z.enum([
  "ROOM_CODE_REQUIRED",
  "ROOM_NOT_FOUND",
  "PARTICIPANT_REQUIRED",
  "START_REQUIRES_HOST",
  "START_REQUIRES_TWO_PLAYERS",
  "ROOM_ALREADY_STARTED",
  "INVALID_REQUEST",
  "ROUTE_NOT_FOUND",
  "UNEXPECTED_ERROR"
]);

export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string()
  })
});

const nonEmptyTrimmedString = z.string().trim().min(1);

const playerNameSchema = z.string().trim().min(1, "Player name is required");

export const createRoomSchema = z.object({
  playerName: playerNameSchema
});

export const joinRoomSchema = z.object({
  playerName: playerNameSchema
});

export const roomCodeParamsSchema = z.object({
  code: nonEmptyTrimmedString.transform((code) => code.toUpperCase())
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export const startGameSchema = z.object({
  participantId: nonEmptyTrimmedString
});

export const roomStatusSchema = z.enum(["lobby", "in-game"]);

export const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
  joinedAt: z.string()
});

export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: roomStatusSchema,
  hostParticipantId: z.string(),
  participants: z.array(participantSchema),
  availableWords: z.array(z.string()),
  roles: z.array(z.enum(["drawer", "guesser"])),
  roundState: z.object({
    drawerId: z.string(),
    secretWord: z.string().optional()
  }).optional()
});

export const roomSessionResponseSchema = z.object({
  participantId: z.string(),
  room: roomSnapshotSchema
});

export const roomResponseSchema = z.object({
  room: roomSnapshotSchema
});

export class HttpError extends Error {
  statusCode: number;
  code: ErrorCode;

  constructor(statusCode: number, message: string, code: ErrorCode = "UNEXPECTED_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
