export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastSeenAt: string;
}

// A single active round. Only round 1 is created in this increment (FR-001).
export interface Round {
  number: number;
  drawerId: string;
  word: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: Round | null;
  createdAt: string;
  updatedAt: string;
}

// Viewer-facing round projection. `word` is included ONLY for the drawer; every
// other viewer receives just the concealed form (FR-006, FR-007, FR-008).
export interface RoundSnapshot {
  number: number;
  drawerId: string;
  wordLength: number;
  maskedWord: string;
  word?: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: RoundSnapshot | null;
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
