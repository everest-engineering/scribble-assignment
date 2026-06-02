export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-progress";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  drawerId: string | null;
  currentWord: string | null;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerId: string | null;
  currentWord: string | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
