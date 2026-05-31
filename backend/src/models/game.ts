export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
}

export interface Stroke {
  points: { x: number; y: number }[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  strokes: Stroke[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  strokes: Stroke[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
