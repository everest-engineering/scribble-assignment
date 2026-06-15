export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active";

export interface Participant {
  id: string;
  name: string;
  score: number;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ActiveRound {
  drawerId: string;
  secretWord: string;
  isFinished: boolean;
  finishedAt?: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  activeRound?: ActiveRound;
  guesses: Guess[];
  canvasCleared: boolean;
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
  viewerRole?: ParticipantRole;
  secretWord?: string;
  guesses: Guess[];
  canvasCleared: boolean;
  canRestartGame: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
