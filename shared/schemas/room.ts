import { z } from "zod";

export const participantRoleSchema = z.enum(["drawer", "guesser"]);

export const participantSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  joinedAt: z.string()
});

export const roomStatusSchema = z.enum(["lobby", "in-progress", "finished"]);

export const guessSnapshotSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  participantName: z.string(),
  text: z.string(),
  correct: z.boolean(),
  submittedAt: z.string()
});

export type GuessSnapshot = z.infer<typeof guessSnapshotSchema>;

export const roomSnapshotSchema = z.object({
  code: z.string(),
  status: roomStatusSchema,
  hostId: z.string(),
  participants: z.array(participantSnapshotSchema),
  availableWords: z.array(z.string()),
  roles: z.array(participantRoleSchema),
  drawerId: z.string().nullable(),
  currentWord: z.string().nullable(),
  canvasDataUrl: z.string().nullable(),
  guesses: z.array(guessSnapshotSchema),
  scores: z.record(z.string(), z.number()),
  roundEndsAt: z.string().nullable(),
  hasGuessedCorrectly: z.boolean(),
  resultExpiresAt: z.string().nullable()
});

export const roomSessionResponseSchema = z.object({
  participantId: z.string(),
  room: roomSnapshotSchema
});

export const roomResponseSchema = z.object({
  room: roomSnapshotSchema
});

export const errorResponseSchema = z.object({
  message: z.string()
});

export type ParticipantRole = z.infer<typeof participantRoleSchema>;
export type ParticipantSnapshot = z.infer<typeof participantSnapshotSchema>;
export type RoomStatus = z.infer<typeof roomStatusSchema>;
export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>;
export type RoomSessionResponse = z.infer<typeof roomSessionResponseSchema>;
export type RoomResponse = z.infer<typeof roomResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
