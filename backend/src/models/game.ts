export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "drawing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastSeenAt: string;
  role?: ParticipantRole;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  roundNumber?: number;
  drawerParticipantId?: string;
  secretWord?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomViewer {
  participantId: string;
  isHost: boolean;
  canStart: boolean;
  role?: ParticipantRole;
  secretWord?: string;
}

export interface RoomParticipantSnapshot {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  role?: ParticipantRole;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  roundNumber?: number;
  drawerParticipantId?: string;
  participants: RoomParticipantSnapshot[];
  viewer?: RoomViewer;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
