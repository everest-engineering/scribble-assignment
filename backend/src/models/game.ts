export type RoomStatus = "lobby" | "playing" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface GuessEntry {
  participantId: string;
  guess: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  drawerId: string | null;
  currentWord: string | null;
  scores: Map<string, number>;
  guessHistory: GuessEntry[];
  canvasStrokes: Stroke[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  availableWords: string[];
  scores: Record<string, number>;
  guessHistory: GuessEntry[];
  canvasStrokes: Stroke[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
