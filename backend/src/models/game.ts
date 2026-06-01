export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "drawing" | "result";

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  points: CanvasPoint[];
  color?: string;
  width?: number;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastSeenAt: string;
  role?: ParticipantRole;
  score?: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  roundNumber?: number;
  drawerParticipantId?: string;
  secretWord?: string;
  revealedWord?: string;
  canvasStrokes?: CanvasStroke[];
  guesses?: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomViewer {
  participantId: string;
  isHost: boolean;
  canStart: boolean;
  role?: ParticipantRole;
  secretWord?: string;
}

export interface RoomParticipantSnapshot {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  role?: ParticipantRole;
  score?: number;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  roundNumber?: number;
  drawerParticipantId?: string;
  participants: RoomParticipantSnapshot[];
  canvasStrokes?: CanvasStroke[];
  guesses?: Guess[];
  revealedWord?: string;
  viewer?: RoomViewer;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
