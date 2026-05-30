export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "results";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface DrawingData {
  paths: DrawingPath[];
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  id: string;
  participantId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ScoreEntry {
  participantId: string;
  playerName: string;
  score: number;
}

export interface ResultSummary {
  correctWord: string;
  winnerId: string;
  winnerName: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId: string | null;
  secretWord: string | null;
  drawing: DrawingData;
  guesses: Guess[];
  scores: ScoreEntry[];
  result: ResultSummary | null;
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

function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

export const api = {
  createRoom(playerName: string) {
    return request<RoomSessionResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(normalizeRoomCode(code))}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const normalizedCode = normalizeRoomCode(code);
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(normalizedCode)}${query}`);
  },
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(normalizeRoomCode(code))}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  updateDrawing(code: string, participantId: string, drawing: DrawingData) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(normalizeRoomCode(code))}/drawing`, {
      method: "PUT",
      body: JSON.stringify({ participantId, drawing })
    });
  },
  clearDrawing(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(normalizeRoomCode(code))}/drawing/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(normalizeRoomCode(code))}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(normalizeRoomCode(code))}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
