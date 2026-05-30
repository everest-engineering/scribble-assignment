export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";
export type WordVisibility = "visible" | "hidden";
export type ScoreAward = 0 | 100;

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  drawnByParticipantId: string;
  createdAt: string;
}

export interface CanvasState {
  strokes: DrawingStroke[];
  clearedAt?: string;
}

export interface StoredGuessEntry {
  id: string;
  participantId: string;
  participantName: string;
  guess: string;
  normalizedGuess: string;
  isCorrect: boolean;
  scoreAwarded: ScoreAward;
  submittedAt: string;
}

export interface GuessHistoryEntry {
  id: string;
  participantId: string;
  participantName: string;
  guess: string;
  isCorrect: boolean;
  scoreAwarded: ScoreAward;
  submittedAt: string;
}

export interface RoundState {
  drawerParticipantId: string;
  secretWord: string;
  startedAt: string;
  endedAt?: string;
  canvas: CanvasState;
  guessHistory: StoredGuessEntry[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  round?: RoundState;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  viewerIsHost: boolean;
  canStartGame: boolean;
  canRestartGame: boolean;
  minimumPlayersToStart: number;
  drawerParticipantId?: string;
  viewerIsDrawer: boolean;
  viewerCanDraw: boolean;
  viewerCanGuess: boolean;
  wordVisibility?: WordVisibility;
  secretWord?: string;
  roundEndedAt?: string;
  canvas?: CanvasState;
  guessHistory?: GuessHistoryEntry[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
