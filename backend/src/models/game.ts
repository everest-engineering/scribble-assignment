export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Guess {
  senderId: string;
  senderName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  drawingData: string;
  guesses: Guess[];
  previousWords: string[];
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
  drawerId: string | null;
  secretWord: string | null;
  drawingData: string;
  guesses: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
