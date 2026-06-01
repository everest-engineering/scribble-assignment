export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  color: string;
  width: number;
  points: Point[];
}

export interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  strokes: DrawingStroke[];
  clearVersion: number;
  guesses: Guess[];
  scores: Map<string, number>;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord?: string;
  yourRole: ParticipantRole;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  strokes: DrawingStroke[];
  clearVersion: number;
  guesses: Guess[];
  scores: { participantId: string; name: string; score: number }[];
  allGuessersCorrect: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
