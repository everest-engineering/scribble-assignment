export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "game";
export type CanvasEventType = "stroke" | "clear";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  points: CanvasPoint[];
  color: string;
  lineWidth: number;
}

export interface CanvasEvent {
  id: string;
  type: CanvasEventType;
  participantId: string;
  createdAt: string;
  stroke?: CanvasStroke;
}

export interface GuessEntry {
  id: string;
  participantId: string;
  rawText: string;
  normalizedText: string;
  isCorrect: boolean;
  pointsAwarded: 0 | 100;
  createdAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerParticipantId: string | null;
  roundPhase: "active" | "ended" | null;
  canvasEvents: CanvasEvent[];
  guessHistory: GuessEntry[];
  scores: Record<string, number>;
  secretWord?: string;
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
  startRoom(code: string, participantId: string, secretWord: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId, secretWord })
    });
  },
  drawCanvas(code: string, participantId: string, stroke: CanvasStroke) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "POST",
      body: JSON.stringify({ participantId, stroke })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, guessText: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, guessText })
    });
  },
  restartRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  }
};
