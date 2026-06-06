export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "started";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
}

export interface GuessRecord {
  participantId: string;
  name: string;
  guess: string;
  correct: boolean;
  at: string;
}

export interface RoundState {
  drawerId: string;
  secretWord: string;
  roles: Record<string, ParticipantRole>;
  strokes: Stroke[];
  guesses: GuessRecord[];
  scores: Record<string, number>;
  ended: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: RoundState | null;
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotParticipant extends Participant {
  isHost: boolean;
  role: ParticipantRole | null;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  participants: SnapshotParticipant[];
  availableWords: string[];
  roles: ParticipantRole[];
  strokes: Stroke[];
  guesses: GuessRecord[];
  roundEnded: boolean;
  secretWord?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
