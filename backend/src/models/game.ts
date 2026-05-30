export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "awaiting_rename" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Round {
  roundNumber: number;
  drawerId: string;
  word: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound: Round | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  roundNumber: number | null;
  drawerId: string | null;
  currentWord?: string;
  invalidParticipantIds?: string[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
