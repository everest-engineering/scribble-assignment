export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  canvasData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  canvasData: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
