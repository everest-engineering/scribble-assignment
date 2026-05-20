export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "result";
export type RoundStatus = "drawing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface CanvasStroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

export interface Guess {
  participantId: string;
  text: string;
  submittedAt: string;
  isCorrect: boolean;
}

export interface GuessSnapshot {
  participantId: string;
  guesserName: string;
  text: string;
  submittedAt: string;
  isCorrect: boolean;
}

export interface Round {
  number: number;
  drawerId: string;
  secretWord: string;
  status: RoundStatus;
  strokes: CanvasStroke[];
  guesses: Guess[];
  scores: Record<string, number>;
  correctGuessers: string[];
  timerStartedAt: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: Round | null;
  timerDuration: number;
  cumulativeScores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoundSnapshot {
  number: number;
  drawerId: string;
  secretWord?: string;
  status: RoundStatus;
  strokes: CanvasStroke[];
  guesses: GuessSnapshot[];
  scores: Record<string, number>;
  correctGuessers: string[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: RoundSnapshot | null;
  availableWords: string[];
  roles: ParticipantRole[];
  cumulativeScores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
