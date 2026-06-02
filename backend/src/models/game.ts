export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  joinedAt: string;
}

export interface GuessEntry {
  id: string;
  playerId: string;
  playerName: string;
  value: string;
  normalizedValue: string;
  isCorrect: boolean;
  createdAt: number;
}

export interface DrawingStrokePoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: DrawingStrokePoint[];
  color?: string;
  size?: number;
}

export interface RoundState {
  phase: "lobby" | "playing" | "result";
  drawerPlayerId: string | null;
  secretWord: string | null;
  drawing: DrawingStroke[];
  guesses: GuessEntry[];
  winnerPlayerId: string | null;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  round: RoundState | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  round: RoundState | null;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
