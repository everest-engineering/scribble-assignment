export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  color: string;
  width: number;
  points: DrawingPoint[];
}

export interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  text: string;
  correct: boolean;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  role: ParticipantRole | null;
  score: number;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  guesses: Guess[];
  strokes: DrawingStroke[];
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantView {
  id: string;
  name: string;
  role: ParticipantRole | null;
  score: number;
  joinedAt: string;
  isHost: boolean;
  isDrawer: boolean;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  participants: ParticipantView[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord: string | null;
  correctWord: string | null;
  guesses: Guess[];
  strokes: DrawingStroke[];
  isHost: boolean;
  isDrawer: boolean;
  canStart: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
