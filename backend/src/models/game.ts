export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: DrawingPoint[];
}

export interface DrawingState {
  strokes: DrawingStroke[];
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface GuessEntry {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  scoreDelta: number;
  submittedAt: string;
}

export interface ParticipantScore {
  participantId: string;
  participantName: string;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  drawerParticipantId?: string;
  word?: string;
  scores?: Record<string, number>;
  drawing?: DrawingState;
  guesses?: GuessEntry[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  isHost: boolean;
  drawerParticipantId: string | null;
  drawerName: string | null;
  secretWord: string | null;
  correctWord: string | null;
  scores: ParticipantScore[];
  drawing: DrawingState;
  guesses: GuessEntry[];
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
