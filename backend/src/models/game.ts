export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  size: number;
  points: DrawingPoint[];
}

export interface GuessEntry {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  submittedAt: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  drawing: DrawingStroke[];
  guesses: GuessEntry[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  hostId: string;
  drawerId: string | null;
  secretWord?: string | null;
  drawing: DrawingStroke[];
  guesses: GuessEntry[];
  scores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
