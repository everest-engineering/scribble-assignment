export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "result";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
}

export interface DrawingState {
  strokes: Stroke[];
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  scoreDelta: number;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface ParticipantSnapshot extends Participant {
  isHost: boolean;
  role: ParticipantRole | null;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  viewerParticipantId?: string;
  viewerRole: ParticipantRole | null;
  drawerParticipantId: string | null;
  participants: ParticipantSnapshot[];
  drawing: DrawingState;
  guesses: Guess[];
  scores: Record<string, number>;
  secretWord?: string;
  canStart: boolean;
  canRestart: boolean;
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
  updateDrawing(code: string, participantId: string, strokes: Stroke[]) {
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
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  },
  restartRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
