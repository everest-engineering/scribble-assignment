export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Guess {
  playerName: string;
  text: string;
  correct: boolean;
  points: number;
  submittedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  drawerName?: string;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  strokes: Point[][];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerName?: string;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  strokes: Point[][];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
