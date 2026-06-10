export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export type CanvasAction =
  | { type: "stroke"; points: { x: number; y: number }[]; color: string; width: number; timestamp: string }
  | { type: "clear"; timestamp: string };

export interface GuessEntry {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string;
  secretWord: string;
  participants: Participant[];
  canvasActions: CanvasAction[];
  guessHistory: GuessEntry[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
  canvasActions: CanvasAction[];
  guessHistory: GuessEntry[];
  scores: Record<string, number>;
  roundOver: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
