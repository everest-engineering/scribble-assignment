export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "round";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface ParticipantView extends Participant {
  isHost: boolean;
  isDrawer: boolean;
}

export interface Round {
  roundNumber: number;
  drawerParticipantId: string;
  secretWord: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  round: Round | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoundView {
  roundNumber: number;
  drawerParticipantId: string;
  maskedWord: string;
  secretWord?: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: ParticipantView[];
  hostParticipantId: string;
  viewerIsHost: boolean;
  canStart: boolean;
  availableWords: string[];
  roles: ParticipantRole[];
  round: RoundView | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
