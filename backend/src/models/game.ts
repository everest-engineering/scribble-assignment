export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "inProgress";
export type GameState = "lobby" | "inProgress" | "finished";
export type RoundStatus = "active" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  score: number;
  submittedAt: string;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  /** High-level game state (lobby | inProgress | finished) */
  gameState: GameState;
  participants: Participant[];
  currentRound?: Round;
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  roundNumber: number;
  status: RoundStatus;
  drawerId: string;
  secretWord: string;
  startedAt: string;
  guessHistory: Guess[];
  totalScore: number;
  /** Populated when the round is finished */
  result?: {
    correctWord: string;
    finalizedAt: string;
  };
}

export interface RoundSnapshot {
  roundNumber: number;
  status: RoundStatus;
  drawerId: string;
  drawerName: string;
  secretWord?: string;
  guessHistory: Guess[];
  totalScore: number;
  result?: {
    correctWord: string;
    finalizedAt: string;
  };
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  gameState: GameState;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: RoundSnapshot;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
