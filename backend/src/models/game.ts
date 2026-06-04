export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
  penDown?: boolean;
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  guess: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ParticipantScore {
  participantId: string;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;

  participants: Participant[];

  hostId: string;

  drawerId?: string;
  secretWord?: string;

  drawing: DrawingPoint[];

  guesses: GuessEntry[];

  scores: ParticipantScore[];

  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;

  participants: Participant[];

  hostId: string;
  drawerId?: string;

  availableWords: string[];
  roles: ParticipantRole[];

  secretWord?: string;

  drawing: DrawingPoint[];

  guesses: GuessEntry[];

  scores: ParticipantScore[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}