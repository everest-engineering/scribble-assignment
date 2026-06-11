export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
}

export type GuessResult = "correct" | "incorrect";

export interface Guess {
  participantId: string;
  text: string;
  result: GuessResult;
  timestamp: string;
}

export interface Round {
  roundNumber: number;
  drawerId: string;
  secretWord: string;
  strokes: Stroke[];
  guesses: Guess[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  rounds: Round[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  roundNumber: number | null;
  drawerId: string | null;
  yourRole: "drawer" | "guesser" | null;
  wordForDrawer: string | undefined;
  wordLength: number | null;
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
