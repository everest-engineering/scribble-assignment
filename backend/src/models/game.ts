export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export type DrawCommand =
  | { type: "stroke"; points: Point[] }
  | { type: "clear" };

export interface Guess {
  participantId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  drawCommands: DrawCommand[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  drawCommands: DrawCommand[];
  scores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
