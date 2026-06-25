export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  text: string;
  correct: boolean;
  scoreDelta: number;
  createdAt: string;
}

export interface Round {
  drawerId: string;
  word: string;
  drawingDataUrl: string | null;
  guesses: Guess[];
  startedAt: string;
  endedAt: string | null;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  scores: Record<string, number>;
  round: Round | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScoreEntry {
  participantId: string;
  playerName: string;
  score: number;
}

export interface RoomResult {
  word: string;
  endedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerId: string | null;
  drawerName: string | null;
  secretWord: string | null;
  wordLength: number | null;
  drawingDataUrl: string | null;
  guesses: Guess[];
  scores: ScoreEntry[];
  result: RoomResult | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
