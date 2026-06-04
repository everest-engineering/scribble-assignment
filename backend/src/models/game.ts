export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  playerId: string;
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
  drawerId?: string;
  drawerIndex: number;
  secretWord?: string;
  canvasData: string;
  guesses: Guess[];
  scores: Record<string, number>;
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
  secretWord?: string;
  isDrawer: boolean;
  canvasData: string;
  guesses: Guess[];
  scores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
