export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  currentDrawerId: string | null;
  currentWord?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  currentDrawerId: string | null;
  participants: Participant[];
  availableWords: string[];
  currentWord?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
