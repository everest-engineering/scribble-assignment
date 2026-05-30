export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  id: string;
  guesserId: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface Score {
  participantId: string;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  guesses: Guess[];
  scores: Score[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
