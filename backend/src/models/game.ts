export type ParticipantRole = "drawer" | "guesser";
export type ViewerRole = "drawer" | "guesser" | "unknown";
export type RoomStatus = "lobby" | "inGame" | "result";

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

export interface CompletedRound {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
  secretWord: string;
  canvas: CanvasState;
  guesses: Guess[];
  scores: ScoreEntry[];
  startedAt: string;
  endedAt: string;
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

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string | null;
  currentRound?: CurrentRound;
  completedRound?: CompletedRound;
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
  canvas?: {
    strokes: DrawingStroke[];
    updatedAt: string;
  };
  guesses?: Guess[];
}

export interface CompletedRoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
  secretWord: string;
  canvas: CanvasState;
  guesses: Guess[];
  scores: ScoreEntry[];
  startedAt: string;
  endedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string | null;
  viewerParticipantId: string | null;
  isHost: boolean;
  canStart: boolean;
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: RoundSnapshot;
  completedRound?: CompletedRoundSnapshot;
  viewerRole: ViewerRole;
  isDrawer: boolean;
  secretWord?: string;
  scores?: ScoreEntry[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
