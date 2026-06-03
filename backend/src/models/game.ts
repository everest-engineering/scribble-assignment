export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface CurrentRound {
  roundIndex: number;
  drawerParticipantId: string;
  secretWord: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  currentRound?: CurrentRound;
  createdAt: string;
  updatedAt: string;
}

export interface RoundSnapshot {
  roundIndex: number;
  drawerParticipantId: string;
  secretWord: string | null;
}

export interface ViewerSnapshot {
  participantId: string;
  isDrawer: boolean;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: RoundSnapshot;
  viewer?: ViewerSnapshot;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
