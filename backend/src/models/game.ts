export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "result";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
}

export interface DrawingState {
  strokes: Stroke[];
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  scoreDelta: number;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundState {
  drawerParticipantId: string;
  secretWord: string;
  drawing: DrawingState;
  guesses: Guess[];
  scores: Record<string, number>;
  startedAt: string;
  endedAt: string | null;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  round: RoundState | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantSnapshot extends Participant {
  isHost: boolean;
  role: ParticipantRole | null;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  viewerParticipantId?: string;
  viewerRole: ParticipantRole | null;
  drawerParticipantId: string | null;
  participants: ParticipantSnapshot[];
  drawing: DrawingState;
  guesses: Guess[];
  scores: Record<string, number>;
  secretWord?: string;
  canStart: boolean;
  canRestart: boolean;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
