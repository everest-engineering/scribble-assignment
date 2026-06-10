export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "results";

export interface Stroke {
  points: Array<{ x: number; y: number }>;
}

export interface GuessEntry {
  participantId: string;
  playerName: string;
  guessText: string;
  correct: boolean;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentDrawerId: string | null;
  secretWord: string | null;
  canvasStrokes: Stroke[];
  guessHistory: GuessEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId: string | null;
  secretWord: string | null;
  canvasStrokes: Stroke[];
  guessHistory: GuessEntry[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
