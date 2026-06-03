import { DrawingAction } from "./drawing.js";
import { Guess } from "./guess.js";

export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastActiveAt?: number; // UNIX timestamp (ms) of last poll
  isDrawer?: boolean;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  secretWord?: string;
  wordLength?: number;
  drawerId?: string;
  roundNumber?: number;
  guesses: Guess[];
  drawingState: DrawingAction[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  hostId: string; // The ID of the host player
  secretWord?: string | null;
  wordLength?: number;
  drawerId?: string;
  roundNumber?: number;
  guesses: Guess[];
  drawingState: DrawingAction[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
