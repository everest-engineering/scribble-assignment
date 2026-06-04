export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

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

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  canvasData: string;
  guesses: Guess[];
  scores: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerId: string | null;
  secretWord: string | null;
  canvasData: string;
  guesses: Guess[];
  scores: Record<string, number>;
  viewerRole: ParticipantRole | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
