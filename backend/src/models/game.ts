export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface DrawingData {
  paths: DrawingPath[];
}

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
  isCorrect: boolean;
  createdAt: string;
}

export interface ScoreEntry {
  participantId: string;
  playerName: string;
  score: number;
}

export interface ResultSummary {
  correctWord: string;
  winnerId: string;
  winnerName: string;
}

export interface RoundState {
  drawerId: string;
  secretWord: string;
  drawing: DrawingData;
  guesses: Guess[];
  scores: Record<string, number>;
  result: ResultSummary | null;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: RoundState | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  drawing: DrawingData;
  guesses: Guess[];
  scores: ScoreEntry[];
  result: ResultSummary | null;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
