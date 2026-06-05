export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "started";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundState {
  drawerId: string;
  secretWord: string;
  roles: Record<string, ParticipantRole>;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  round: RoundState | null;
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotParticipant extends Participant {
  isHost: boolean;
  role: ParticipantRole | null;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  drawerId: string | null;
  participants: SnapshotParticipant[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
