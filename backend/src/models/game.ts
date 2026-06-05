export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "result";

export type Point = { x: number; y: number };

export interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
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
  drawerId?: string;
  currentWord?: string;
  canvasStrokes?: Point[][];
  guesses?: Guess[];
  scores?: Record<string, number>;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  currentWord?: string;
  canvasStrokes?: Point[][];
  guesses?: Guess[];
  scores?: Record<string, number>;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
