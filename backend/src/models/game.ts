export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  size: number;
  points: DrawingPoint[];
}

export interface CanvasState {
  strokes: DrawingStroke[];
  updatedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  pointsAwarded: number;
  createdAt: string;
}

export interface ScoreEntry {
  participantId: string;
  participantName: string;
  score: number;
}

export interface CurrentRound {
  roundNumber: number;
  drawerParticipantId: string;
  secretWord: string;
  startedAt: string;
  canvas: CanvasState;
  guesses: Guess[];
  correctGuessParticipantIds: string[];
}

export interface RoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
  canvas: CanvasState;
  guesses: Guess[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  currentRound?: CurrentRound;
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  viewerParticipantId?: string;
  isHost: boolean;
  canStart: boolean;
  currentRound?: RoundSnapshot;
  viewerRole?: ParticipantRole;
  isDrawer: boolean;
  secretWord?: string;
  scores: ScoreEntry[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
