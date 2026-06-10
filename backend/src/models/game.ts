export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "completed";

export interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
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
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  scores: Record<string, number>;
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  scores: Record<string, number>;
  guesses: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
