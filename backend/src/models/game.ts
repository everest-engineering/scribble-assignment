export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface CanvasStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  round: number;
  guesses: Guess[];
  drawing: CanvasStroke[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  round: number;
  guesses: Guess[];
  drawing: CanvasStroke[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}
