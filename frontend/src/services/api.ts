export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  size: number;
  points: DrawingPoint[];
}

export interface DrawingStrokeInput {
  color: string;
  size: number;
  points: DrawingPoint[];
}

export interface CanvasState {
  strokes: DrawingStroke[];
  updatedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  pointsAwarded: number;
  createdAt: string;
}

export interface ScoreEntry {
  participantId: string;
  participantName: string;
  score: number;
}

export interface RoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
  canvas: CanvasState;
  guesses: Guess[];
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostParticipantId: string;
  viewerParticipantId?: string;
  isHost: boolean;
  canStart: boolean;
  currentRound?: RoundSnapshot;
  viewerRole?: ParticipantRole;
  isDrawer: boolean;
  secretWord?: string;
  scores: ScoreEntry[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Request failed" }))) as {
      message?: string;
    };

    throw new Error(errorBody.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  createRoom(playerName: string) {
    return request<RoomSessionResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  startRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  submitDrawingStroke(code: string, participantId: string, stroke: DrawingStrokeInput) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/drawing`, {
      method: "POST",
      body: JSON.stringify({ participantId, stroke })
    });
  },
  clearDrawing(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/drawing/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, guess: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, guess: guess.trim() })
    });
  }
};
