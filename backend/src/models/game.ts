export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
  role?: ParticipantRole;
}

export interface Round {
  drawerId: string;
  secretWord: string;
  startedAt: string;
  endedAt: string | null;
  status: "active" | "finished";
}

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  normalizedText: string;
  correct: boolean;
  createdAt: string;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  participantId: string;
  points: StrokePoint[];
  color?: string;
  createdAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: Round | null;
  guesses: Guess[];
  strokes: Stroke[];
  createdAt: string;
  updatedAt: string;
  availableWords?: string[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  round?: Partial<Round> | null;
  guesses?: Guess[];
  strokes?: Stroke[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
