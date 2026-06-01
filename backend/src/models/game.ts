export type ParticipantRole = "drawer" | "guesser";
export type ViewerRole = "drawer" | "guesser" | "unknown";
export type RoomStatus = "lobby" | "inGame";

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

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string | null;
  currentRound?: CurrentRound;
  createdAt: string;
  updatedAt: string;
}

export interface RoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string | null;
  viewerParticipantId: string | null;
  isHost: boolean;
  canStart: boolean;
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: RoundSnapshot;
  viewerRole: ViewerRole;
  isDrawer: boolean;
  secretWord?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
