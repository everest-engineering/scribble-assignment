export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  isDrawer: boolean;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  word: string | null;
  drawingData: string | null;
  guesses: Guess[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  canStart: boolean;
  word: string | null;
  drawingData: string | null;
  guesses: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
