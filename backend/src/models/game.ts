export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "inProgress";
export type GameState = "lobby" | "inProgress" | "finished";
export type RoundStatus = "active";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  hostId: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound?: Round;
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  roundNumber: number;
  status: RoundStatus;
  drawerId: string;
  secretWord: string;
  startedAt: string;
}

export interface RoundSnapshot {
  roundNumber: number;
  status: RoundStatus;
  drawerId: string;
  drawerName: string;
  secretWord?: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  gameState: GameState;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: RoundSnapshot;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
