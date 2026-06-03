export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "results";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Stroke {
  id: string;
  playerId: string;
  points: { x: number; y: number }[];
  color: string;
  lineWidth: number;
}

export interface Guess {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface PlayerScore {
  playerId: string;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  strokes: Stroke[];
  guesses: Guess[];
  playerScores: Map<string, number>;
  hasScored: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
  currentWord: string | null;
  strokes: Stroke[];
  guesses: Guess[];
  playerScores: { playerId: string; score: number; name: string }[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
