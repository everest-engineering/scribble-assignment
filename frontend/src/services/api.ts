export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  joinedAt: string;
}

export interface GuessEntry {
  id: string;
  playerId: string;
  playerName: string;
  value: string;
  normalizedValue: string;
  isCorrect: boolean;
  createdAt: number;
}

export interface DrawingStrokePoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: DrawingStrokePoint[];
  color?: string;
  size?: number;
}

export interface RoundState {
  phase: "lobby" | "playing" | "result";
  drawerPlayerId: string | null;
  secretWord: string | null;
  drawing: DrawingStroke[];
  guesses: GuessEntry[];
  winnerPlayerId: string | null;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  round: RoundState | null;
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
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  updateDrawing(code: string, participantId: string, strokes: DrawingStroke[]) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/drawing`, {
      method: "POST",
      body: JSON.stringify({ participantId, strokes })
    });
  },
  clearDrawing(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/drawing/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, value: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, value })
    });
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
