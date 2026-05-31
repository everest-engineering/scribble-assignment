export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: Point[];
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  scores: Record<string, number>;
  strokes: Stroke[];
  guesses: Guess[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  participants: Participant[];
  scores: Record<string, number>;
  strokes: Stroke[];
  guesses: Guess[];
  secretWord?: string;
  availableWords?: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
