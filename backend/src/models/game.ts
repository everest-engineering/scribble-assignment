export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string;
  secretWord: string;
  round: number;
  guesses: Guess[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string;
  secretWord?: string;
  round: number;
  guesses: Guess[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
