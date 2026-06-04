export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-game" | "ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  playerId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export type Scoreboard = Record<string, number>;

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  currentWord: string | null;
  createdAt: string;
  updatedAt: string;
  canvasData: any;
  guessHistory: Guess[];
  scoreboard: Scoreboard;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  isHost: boolean;
  participants: (Participant & { isDrawer: boolean })[];
  currentWord: string | null;
  canvasData: any;
  guessHistory: Guess[];
  scoreboard: Scoreboard;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
