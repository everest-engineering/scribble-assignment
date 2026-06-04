export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active";

export interface GuessLog {
  id: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
  score: number;
  hasGuessedCorrectly: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId?: string;
  currentWord?: string;
  drawingData?: string;
  guesses: GuessLog[];
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
  drawerId?: string;
  wordTemplate?: string;
  drawingData?: string;
  guesses: GuessLog[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
