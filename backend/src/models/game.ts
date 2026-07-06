export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "drawing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timestamp: string;
}

export type ScoreMap = Record<string, number>;

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: number;
  currentDrawerId: string;
  secretWord: string | null;
  scores: ScoreMap;
  guesses: Guess[];
  canvasStrokes: Stroke[];
  correctGuessersInRound: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound: number;
  currentDrawerId: string;
  secretWord: string | null;
  scores: ScoreMap;
  guesses: Guess[];
  canvasStrokes: Stroke[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
