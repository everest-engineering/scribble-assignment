export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface GuessSnapshot {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface ParticipantSnapshot extends Participant {
  isHost: boolean;
  role?: ParticipantRole;
  score?: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  scores?: Record<string, number>;
  strokes?: DrawingStroke[];
  guesses?: Guess[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  isHost: boolean;
  canStart: boolean;
  drawerId?: string;
  viewerRole?: ParticipantRole | null;
  secretWord?: string | null;
  strokes?: DrawingStroke[];
  guesses?: GuessSnapshot[];
  participants: ParticipantSnapshot[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
