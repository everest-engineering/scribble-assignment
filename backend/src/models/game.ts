export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface CurrentRound {
  roundIndex: number;
  drawerParticipantId: string;
  secretWord: string;
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
  winnerParticipantId?: string;
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

export interface GuessSnapshot {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ScoreSnapshot {
  participantId: string;
  name: string;
  score: number;
}

export interface RoundSnapshot {
  roundIndex: number;
  drawerParticipantId: string;
  secretWord: string | null;
  strokes: Stroke[];
  guesses: GuessSnapshot[];
  scores: ScoreSnapshot[];
  winnerParticipantId: string | null;
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
