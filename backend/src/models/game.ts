export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-progress" | "finished";

export interface Point {
  x: number;
  y: number;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface GuessEntry {
  guesserName: string;
  guessText: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface CurrentRound {
  roundNumber: number;
  drawerId: string;
  wordIndex: number;
  guesses: GuessEntry[];
  scores: Record<string, number>;
  strokes: Point[][];
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound?: CurrentRound;
  createdAt: string;
  updatedAt: string;
}

export interface RoundResult {
  revealedWord: string;
  scores: Record<string, number>;
  guesses: GuessEntry[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  secretWord?: string;
  result?: RoundResult;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
