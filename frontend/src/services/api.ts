export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
}

export interface DrawStroke {
  type: "draw";
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  lineWidth: number;
}

export interface ClearStroke {
  type: "clear";
}

export type Stroke = DrawStroke | ClearStroke;

export interface SnapshotGuessRecord {
  participantName: string;
  text: string;
  correct: boolean;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId: string | null;
  currentWord: string | null;
  strokes: Stroke[];
  guesses: SnapshotGuessRecord[];
  status: "lobby" | "playing" | "finished";
  participants: Participant[];
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
  endRound(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/end`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitStroke(code: string, participantId: string, strokeData: Stroke) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/strokes`, {
      method: "POST",
      body: JSON.stringify({ ...strokeData, participantId })
    });
  },
  submitGuess(code: string, participantId: string, guess: string) {
    return request<{ correct: boolean; score: number }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, guess })
    });
  }
};
