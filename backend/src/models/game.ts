export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastSeenAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  guess: string;
  correct: boolean;
  timestamp: string;
  roundScoreAfter: number;
  cumulativeScoreAfter: number;
}

export interface ParticipantScore {
  roundScore: number;
  cumulativeScore: number;
}

export interface RoundResult {
  roundNumber: number;
  secretWord: string;
  drawerId: string;
  drawerName: string;
  guessHistory: GuessEntry[];
  scores: Record<string, ParticipantScore>;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  currentRound?: number;
  drawerId?: string;
  secretWord?: string;
  strokes: DrawingStroke[];
  guessHistory: GuessEntry[];
  scores: Record<string, ParticipantScore>;
  lastRoundResult?: RoundResult;
  lastRoundResultSetAt?: number;
  skipSuggested: boolean;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: number;
  drawerId?: string;
  secretWord?: string;
  strokes: DrawingStroke[];
  guessHistory: GuessEntry[];
  scores: Record<string, ParticipantScore>;
  lastRoundResult?: RoundResult;
  hostDisconnected?: boolean;
  drawerDisconnected?: boolean;
  skipSuggested?: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
