export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
  isHost?: boolean;
  score?: number;
}

export interface Guess {
  id: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  scoreAwarded: number;
  timestamp: string;
}

export interface GameRound {
  secretWord: string;
  startedAt: string;
  drawingData?: string;
  guesses: Guess[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  round?: GameRound;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
  drawingData?: string;
  guesses?: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
