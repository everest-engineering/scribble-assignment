export type ParticipantRole = "drawer" | "guesser" | "host";
export type RoomStatus = "lobby" | "game" | "results";
export type RoundStatus = "SelectingWord" | "Drawing" | "Ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Round {
  drawerId: string;
  wordOptions?: string[]; // Optional since it's hidden from Guessers
  secretWord?: string | null; // Optional since it's hidden from Guessers
  roundStatus: RoundStatus;
  roundEndTime: number | null;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  brushSize: number;
  points: Point[];
  isComplete: boolean;
}

export interface Guess {
  userId: string;
  text: string;
  timestamp: number;
  isCorrect: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound?: Round;
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
  lastGuessTime: Record<string, number>;
  lastSeenTime?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound?: Round;
  availableWords: string[];
  roles: ParticipantRole[];
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
