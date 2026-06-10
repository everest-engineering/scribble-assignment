export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface ParticipantView extends Participant {
  isHost: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: ParticipantView[];
  hostParticipantId: string;
  viewerIsHost: boolean;
  canStart: boolean;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
