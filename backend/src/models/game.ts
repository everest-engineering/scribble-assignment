export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Stroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  lineWidth: number;
}

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

export interface Room {
  code: string;
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  status: RoomStatus;
  participants: Participant[];
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
