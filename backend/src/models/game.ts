export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

/** A single freehand line drawn by the drawer, synced to all viewers via polling. */
export interface Stroke {
  color: string;
  width: number;
  points: Array<{ x: number; y: number }>;
}

export interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  text: string;
  correct: boolean;
  createdAt: string;
}

/** State that exists only while a round is in progress or being shown as a result. */
export interface Round {
  drawerId: string;
  word: string;
  strokes: Stroke[];
  guesses: Guess[];
  /** Set once a guesser is correct; drives the transition into the results state. */
  winnerId: string | null;
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

export interface ParticipantView {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isDrawer: boolean;
}

export interface ViewerView {
  participantId: string;
  isHost: boolean;
  isDrawer: boolean;
  role: ParticipantRole | null;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: ParticipantView[];
  drawerId: string | null;
  guesses: Guess[];
  strokes: Stroke[];
  /** The secret word — only present for the drawer during play, and for everyone in results. */
  word: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
  viewer: ViewerView | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
