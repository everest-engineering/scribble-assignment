export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role: ParticipantRole;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  currentWord?: string;
  currentRound?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  currentWord: string | null;
  currentWordLength: number;
  currentRound: number;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
