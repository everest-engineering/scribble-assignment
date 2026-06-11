export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  drawingData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: Guess[];
  drawingData: string | null;
  availableWords: string[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
