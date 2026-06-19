export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Guess {
  id: string;
  participantId: string;
  name: string;
  text: string;
  correct: boolean;
  at: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  participants: Participant[];
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  role?: ParticipantRole;
  word?: string;
  participants: Participant[];
  guesses: Guess[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
