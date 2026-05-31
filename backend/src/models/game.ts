export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-game";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundState {
  drawerId: string;
  secretWord: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
  roundState?: RoundState;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  roundState?: {
    drawerId: string;
    secretWord?: string;
  };
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
