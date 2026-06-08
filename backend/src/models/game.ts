export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastSeenAt: string;
  // Points this game. 0 at round start; +100 on a player's first correct
  // guess of the round (FR-005, FR-006, FR-007).
  score: number;
}

// A single guess submitted during the active round (FR-008).
export interface Guess {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  correct: boolean;
  createdAt: string;
}

// A single active round. Only round 1 is created in this increment (FR-001).
export interface Round {
  number: number;
  drawerId: string;
  word: string;
  // Ordered guess history (append-only this round). FR-008, FR-010
  guesses: Guess[];
  // Players who have already scored this round; enforces the once-per-round
  // 100-point award (FR-007).
  correctPlayerIds: string[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: Round | null;
  createdAt: string;
  updatedAt: string;
}

// Viewer-facing guess projection. `text` is included ONLY for incorrect guesses;
// for a correct guess it is omitted entirely so the secret word never leaks
// through the feed (FR-011, SC-008).
export interface GuessSnapshot {
  id: string;
  playerId: string;
  playerName: string;
  correct: boolean;
  text?: string;
}

// Viewer-facing round projection. `word` is included ONLY for the drawer; every
// other viewer receives just the concealed form (FR-006, FR-007, FR-008).
export interface RoundSnapshot {
  number: number;
  drawerId: string;
  wordLength: number;
  maskedWord: string;
  word?: string;
  // Ordered guess history; correct entries are masked (no `text`). FR-008, FR-010, FR-011
  guesses: GuessSnapshot[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: RoundSnapshot | null;
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
