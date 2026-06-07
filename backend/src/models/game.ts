export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "roundEnd";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  currentDrawerId: string | null;
  currentWord: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  canvasData: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  currentDrawerId: string | null;
  currentWord: string | null;
  guesses: Guess[];
  scores: Record<string, number>;
  canvasData: string;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
