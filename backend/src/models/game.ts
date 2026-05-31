export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  drawerId: string;
  secretWord: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerId: string;
  secretWord?: string;
  wordPlaceholder?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
