export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "finished";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Stroke {
  points: { x: number; y: number }[];
}

export interface Guess {
  participantId: string;
  playerName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  drawerId: string | null;
  secretWord: string | null;
  scores: Record<string, number>;
  canvasStrokes: Stroke[];
  guesses: Guess[];
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  status: RoomStatus;
  drawerId: string | null;
  myRole: ParticipantRole | null;
  secretWord: string | null;
  scores: Record<string, number>;
  canvasStrokes: Stroke[];
  guesses: Guess[];
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
