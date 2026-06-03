export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Round {
  drawerParticipantId: string;
  secretWord: string;
}

export interface SnapshotRound {
  drawerParticipantId: string;
  secretWord: string | null;
}

export interface Guess {
  id: string;
  guesserParticipantId: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
  order: number;
}

export interface SnapshotGuess {
  id: string;
  guesserParticipantId: string;
  text: string | null;
  isCorrect: boolean;
  submittedAt: string;
  order: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  currentRound: Round | null;
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  currentRound: SnapshotRound | null;
  guesses: SnapshotGuess[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
