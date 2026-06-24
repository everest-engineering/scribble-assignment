export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "awaiting_rename" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export interface Guess {
  participantId: string;
  guesserName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Round {
  roundNumber: number;
  drawerId: string;
  word: string;
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound: Round | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  roundNumber: number | null;
  drawerId: string | null;
  currentWord?: string;
  invalidParticipantIds?: string[];
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
