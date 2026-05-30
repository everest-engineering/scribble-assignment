export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
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
  drawerId: string | null;
  secretWord: string | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
