export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  round: number;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  round: number;
  participants: Participant[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export interface StartGameResponse {
  started: boolean;
  room: RoomSnapshot;
}
