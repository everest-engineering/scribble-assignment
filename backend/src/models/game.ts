export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface Room {
  code: string;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
