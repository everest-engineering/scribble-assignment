export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";

// Aligned with react-sketch-canvas CanvasPath interface
export interface Stroke {
  paths: { x: number; y: number }[];
  strokeColor: string;
  strokeWidth: number;
  drawMode: boolean;
  startTimestamp?: number;
  endTimestamp?: number;
}

export interface Guess {
  participantId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role: ParticipantRole | null;
  score: number;
  hasGuessedCorrectly: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  secretWord: string | null;
  strokes: Stroke[];
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  secretWord: string | null;
  strokes: Stroke[];
  guesses: Guess[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
