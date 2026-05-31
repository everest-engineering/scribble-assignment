export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "round_end" | "game_over";
export type Drawing = number[][][];

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Round {
  number: number;
  drawerId: string;
  secretWord: string;
  status: "drawing" | "guessing" | "revealed";
  guesses: Guess[];
  drawing: Drawing;
  hasCorrectGuess: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: number;
  rounds: Round[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: number;
  drawerId: string;
  secretWord: string | null;
  guesses: Guess[];
  drawing: Drawing;
  availableWords: string[];
  roles: ParticipantRole[];
  isHost: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
