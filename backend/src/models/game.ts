export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "round_end" | "game_over";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  color: string;
  points: Point[];
}

export interface CanvasState {
  strokes: Stroke[];
}

export interface Guess {
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
}

export interface RoundResult {
  secretWord: string;
  scores: Record<string, number>;
  roundScores: Record<string, number>;
  correctGuessers: string[];
  allCorrect: boolean;
  endedEarly: boolean;
  roundNumber: number;
}

export interface FinalStanding {
  participantId: string;
  name: string;
  score: number;
  rank: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  secretWord?: string;
  scores: Record<string, number>;
  guessLog: Guess[];
  roundEnded: boolean;
  roundCounter: number;
  maxRounds: number;
  currentDrawerIndex: number;
  wordIndex: number;
  roundResult?: RoundResult;
  finalStandings?: FinalStanding[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
  scores?: Record<string, number>;
  guessLog?: Guess[];
  roundEnded?: boolean;
  roundCounter?: number;
  maxRounds?: number;
  roundResult?: RoundResult;
  finalStandings?: FinalStanding[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
