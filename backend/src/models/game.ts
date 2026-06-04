export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface DrawPoint {
  x: number;
  y: number;
}

export type DrawStroke = DrawPoint[];

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: GuessEntry[];
  scores: Record<string, number>;
  drawStrokes: DrawStroke[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  guesses: GuessEntry[];
  scores: Record<string, number>;
  drawStrokes: DrawStroke[];
  availableWords: string[];
  roles: ParticipantRole[];
  viewerRole: ParticipantRole | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
