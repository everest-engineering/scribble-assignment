export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ParticipantView extends Participant {
  role: ParticipantRole;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  scores: Record<string, number>;
  guesses: Guess[];
  drawingStrokes: DrawingStroke[];
  createdAt: string;
  updatedAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  width: number;
  points: DrawingPoint[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord?: string;
  participants: ParticipantView[];
  guesses: Guess[];
  drawingStrokes: DrawingStroke[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
