export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  hostId: string;
  isHost: boolean;
  canStart: boolean;
  drawerId: string | null;
  isDrawer: boolean;
  secretWord: string | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
