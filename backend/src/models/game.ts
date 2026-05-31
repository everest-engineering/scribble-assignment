export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-game" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface RoundState {
  drawerId: string;
  secretWord: string;
}

export interface GuessEntry {
  id: string;
  participantId: string;
  playerName: string;
  guessText: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  roundState?: RoundState;
  guessHistory: GuessEntry[];
  correctGuesserId?: string | null;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  roundState?: {
    drawerId: string;
    secretWord?: string;
  };
  guessHistory: GuessEntry[];
  correctGuesserId?: string | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
