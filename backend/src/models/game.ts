export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "results";

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
  points: Point[];
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  drawerId?: string;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  drawing: DrawingStroke[];
  correctGuessers: string[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerId?: string;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  drawing: DrawingStroke[];
  correctGuessers: string[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
