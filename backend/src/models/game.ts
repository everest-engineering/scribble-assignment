export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface DrawStroke {
  type: "draw";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  lineWidth: number;
}

export interface ClearStroke {
  type: "clear";
}

export type Stroke = DrawStroke | ClearStroke;

export interface GuessRecord {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
}

export interface SnapshotGuessRecord {
  participantName: string;
  text: string;
  correct: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  strokes: Stroke[];
  guesses: GuessRecord[];
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  strokes: Stroke[];
  guesses: SnapshotGuessRecord[];
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
