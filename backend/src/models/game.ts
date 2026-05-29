export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";
export type WordVisibility = "visible" | "hidden";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundState {
  drawerParticipantId: string;
  secretWord: string;
  startedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  round?: RoundState;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  viewerIsHost: boolean;
  canStartGame: boolean;
  minimumPlayersToStart: number;
  drawerParticipantId?: string;
  viewerIsDrawer: boolean;
  wordVisibility?: WordVisibility;
  secretWord?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
