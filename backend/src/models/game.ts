export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "ended";

export interface Participant {
  id: string;
  name: string;
  score: number;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  text: string;
  correct: boolean;
  createdAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  // The secret word is included only for the drawer-viewer; null for everyone else.
  word: string | null;
  participants: Participant[];
  guesses: Guess[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
