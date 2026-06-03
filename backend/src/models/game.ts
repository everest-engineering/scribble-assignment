export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

export type CanvasState = Stroke[];

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  currentDrawerId?: string;
  currentWord?: string;
  roundNumber?: number;
  strokes: CanvasState;
  guesses: Guess[];
  scores: Record<string, number>;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  currentWord?: string | null;
  strokes?: CanvasState;
  guesses?: Guess[];
  scores?: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
