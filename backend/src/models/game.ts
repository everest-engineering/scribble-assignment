export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  correct: boolean;
  text: string;
  createdAt: string;
}

export interface GuessView {
  id: string;
  participantId: string;
  participantName: string;
  correct: boolean;
  text: string | null;
  createdAt: string;
}

export interface ScoreView {
  participantId: string;
  name: string;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  drawing: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  hostId: string;
  isHost: boolean;
  canStart: boolean;
  drawerId: string | null;
  isDrawer: boolean;
  secretWord: string | null;
  guesses: GuessView[];
  scores: ScoreView[];
  drawing: string | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
