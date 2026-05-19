export type ParticipantRole = "drawer" | "guesser";
export type LobbyParticipantRole = "host" | "player";
export type RoomStatus = "lobby" | "playing" | "result";

export interface GuessEntry {
  id: string;
  participantId: string;
  text: string;
  submittedAt: string;
  isCorrect: boolean;
}

export interface ScoreEntry {
  participantId: string;
  score: number;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role: LobbyParticipantRole;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId?: string;
  guesserIds: string[];
  secretWord?: string;
  guessHistory: GuessEntry[];
  scores: Record<string, number>;
  winnerId?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId?: string;
  viewerRole?: ParticipantRole;
  secretWord?: string;
  guessHistory?: GuessEntry[];
  scores?: ScoreEntry[];
  winnerId?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
