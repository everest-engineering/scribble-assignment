export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active";

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
  currentWord: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
  currentWord: string | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
