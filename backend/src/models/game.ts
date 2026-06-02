export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface Guess {
  participantId: string;
  participantName: string;
  guess: string;
  correct: boolean;
  createdAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId?: string;
  secretWord?: string;
  scores: Record<string, number>;
  guesses: Guess[];
  drawingPaths: DrawingPath[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "active" | "results";
  participants: Participant[];
  drawerId?: string;
  secretWord?: string;
  scores: Record<string, number>;
  guesses: Guess[];
  drawingPaths: DrawingPath[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
