import type { CanvasState } from "./canvas.js";

export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
}

export interface ParticipantSnapshot {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  role: ParticipantRole | null;
}

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface RoundResult {
  secretWord: string;
  guessHistory: Guess[];
  scores: Record<string, number>;
  winnerId: string | null;
  endedAt: string;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  word?: string;
  canvasState?: CanvasState | null;
  guesses: Guess[];
  scores: Record<string, number>;
  roundResult: RoundResult | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: ParticipantSnapshot[];
  hostId: string;
  word?: string;
  availableWords: string[];
  roles: ParticipantRole[];
  guesses: Guess[];
  scores: Record<string, number>;
  roundResult: RoundResult | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
