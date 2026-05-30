export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface ParticipantSnapshot {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  role: ParticipantRole | null;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId: string | null;
  secretWord: string | null;
  strokes: Stroke[];
  guesses: Guess[];
  scoredParticipantIds: string[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId: string | null;
  participants: ParticipantSnapshot[];
  availableWords: string[];
  roles: ParticipantRole[];
  strokes?: Stroke[];
  guesses?: Guess[];
  secretWord?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

export interface StrokeInput {
  points: Point[];
  color?: string;
  width?: number;
}
