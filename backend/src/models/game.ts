export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  text: string;
  normalizedText: string;
  correct: boolean;
  timestamp: string;
  scoreImpact: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  participants: Participant[];
  canvasState?: string | null;
  guessHistory: Guess[];
  scores: Record<string, number>;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  isHost: boolean;
  isDrawer: boolean;
  secretWord?: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  canvasState?: string | null;
  guessHistory: Guess[];
  scores: Record<string, number>;
  endedAt?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
