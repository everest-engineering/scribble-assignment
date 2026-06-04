export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  gameStarted: boolean;
  currentDrawer: string | null;
  secretWord: string | null;
  guesses?: {
    participantId: string;
    text: string;
    timestamp: string;
    correct: boolean;
  }[];
  scores?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  gameStarted: boolean;
  currentDrawer: string | null;
  secretWord?: string | null;
  guesses?: {
    participantId: string;
    text: string;
    timestamp: string;
    correct: boolean;
  }[];
  scores?: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
