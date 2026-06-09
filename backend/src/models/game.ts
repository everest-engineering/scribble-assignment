export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-progress" | "finished";
export type RoundPhase = "word-selection" | "drawing" | "finished";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean | null;
  guessedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundState {
  drawerId: string;
  guesserIds: string[];
  wordOptions: string[];
  secretWord: string | null;
  phase: RoundPhase;
  strokes: Stroke[];
  guesses: Guess[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  round: RoundState | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  phase: RoundPhase | null;
  wordOptions: string[] | null;
  secretWord: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
  strokes: Stroke[];
  guesses: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
