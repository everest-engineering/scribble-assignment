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
  drawerParticipantId: string | null;
  currentWord: string | null;
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
  drawerParticipantId: string | null;
  currentWord: string | null;
  viewerRole: ParticipantRole | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
