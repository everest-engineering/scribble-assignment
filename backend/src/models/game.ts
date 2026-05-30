export type ParticipantRole = "drawer" | "guesser" | "host";
export type RoomStatus = "lobby" | "game";
export type RoundStatus = "SelectingWord" | "Drawing" | "Ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Round {
  drawerId: string;
  wordOptions?: string[]; // Optional since it's hidden from Guessers
  secretWord?: string | null; // Optional since it's hidden from Guessers
  roundStatus: RoundStatus;
  roundEndTime: number | null;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound?: Round;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound?: Round;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
