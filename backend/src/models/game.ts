export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "drawing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  currentRound: number;
  currentDrawerId: string;
  secretWord: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound: number;
  currentDrawerId: string;
  secretWord: string | null;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
