export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-progress" | "finished";
export type RoundPhase = "word-selection" | "drawing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundState {
  drawerId: string;
  guesserIds: string[];
  wordOptions: string[];
  secretWord: string | null;
  phase: RoundPhase;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  round: RoundState | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  phase: RoundPhase | null;
  wordOptions: string[] | null;
  secretWord: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
