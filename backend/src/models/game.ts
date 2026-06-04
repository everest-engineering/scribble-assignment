export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game" | "result";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  guess: string;
  isCorrect: boolean;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
  score: number;
  hasGuessedCorrectly: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  currentDrawerId: string | null;
  currentWord?: string;
  participants: Participant[];
  drawing: Stroke[];
  guessHistory: GuessEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  currentDrawerId: string | null;
  participants: Participant[];
  drawing: Stroke[];
  guessHistory: GuessEntry[];
  availableWords: string[];
  currentWord?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
