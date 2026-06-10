export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

export interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Round {
  roundNumber: number;
  drawerParticipantId: string;
  secretWord: string | null;
  scores: Record<string, number>;
  guesses: Guess[];
  isComplete: boolean;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Room {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  currentRound?: Round;
  canvasState: { strokes: Stroke[] };
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: Round;
  canvasState: { strokes: Stroke[] };
}

export interface HostAwareRoomSnapshot extends RoomSnapshot {
  hostParticipantId: string;
  viewerIsHost?: boolean;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
