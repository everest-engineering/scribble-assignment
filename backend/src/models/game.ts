export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "drawing" | "results";
export type RoundStatus = "drawing" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface GameRound {
  word: string;
  drawerId: string;
  status: RoundStatus;
  guesses: Guess[];
  drawingData: string | null;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: GameRound | null;
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  scores: Record<string, number>;
  guesses: Guess[];
  drawingData: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
