export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface CurrentRound {
  roundNumber: number;
  drawerParticipantId: string;
  secretWord: string;
  startedAt: string;
}

export interface RoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  currentRound?: CurrentRound;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  viewerParticipantId?: string;
  isHost: boolean;
  canStart: boolean;
  currentRound?: RoundSnapshot;
  viewerRole?: ParticipantRole;
  isDrawer: boolean;
  secretWord?: string;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
