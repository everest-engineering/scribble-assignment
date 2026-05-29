export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  role?: ParticipantRole;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentDrawerId?: string;
  currentWord?: string;
  createdAt: string;
  updatedAt: string;
  guesses: Guess[];
  canvasLines: string[];
}

export interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  message: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  currentWord?: string;
  guesses: Guess[];
  canvasLines: string[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
