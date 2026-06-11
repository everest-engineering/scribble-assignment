export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

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

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  secretWord?: string;
  scores: Record<string, number>;
  guessLog: Guess[];
  roundEnded: boolean;
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
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
