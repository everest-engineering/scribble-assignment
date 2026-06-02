export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentDrawerId: string | null;
  roundNumber: number;
  scores: Record<string, number>;
  guesses: Guess[];
  correctGuessers: string[];
  canvasStrokes: Stroke[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId: string | null;
  roundNumber: number;
  secretWord: string | null;
  scores: Record<string, number>;
  guesses: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  isHost: boolean;
  room: RoomSnapshot;
}
