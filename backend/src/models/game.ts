export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active";
export type RoundStatus = "drawing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Round {
  number: number;
  drawerId: string;
  secretWord: string;
  status: RoundStatus;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: Round | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoundSnapshot {
  number: number;
  drawerId: string;
  secretWord?: string;
  status: RoundStatus;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: RoundSnapshot | null;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
