export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-progress" | "finished";

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  drawerId: string | null;
  currentWord: string | null;
  canvasDataUrl: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  correctGuessers: Set<string>;
  roundStartedAt: string | null;
}

export interface GuessSnapshot {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerId: string | null;
  currentWord: string | null;
  canvasDataUrl: string | null;
  guesses: GuessSnapshot[];
  scores: Record<string, number>;
  roundEndsAt: string | null;
  hasGuessedCorrectly: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
