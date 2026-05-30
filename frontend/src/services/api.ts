export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "awaiting_rename" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
  color: string;
  width: number;
}

export interface Guess {
  participantId: string;
  guesserName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  roundNumber: number | null;
  drawerId: string | null;
  currentWord?: string;
  invalidParticipantIds?: string[];
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export interface GameActionResponse {
  status: "playing" | "awaiting_rename";
  invalidParticipantIds?: string[];
  room: RoomSnapshot;
}

export interface RoundEndResponse {
  status: "result";
  room: RoomSnapshot;
}

export interface RestartResponse {
  status: "lobby";
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
    return request<GameActionResponse>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  rename(code: string, participantId: string, name: string) {
    return request<GameActionResponse>(`/rooms/${encodeURIComponent(code)}/rename`, {
      method: "POST",
      body: JSON.stringify({ participantId, name })
    });
  },
  disband(code: string, participantId: string) {
    return request<{ message: string }>(`/rooms/${encodeURIComponent(code)}/disband`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  },
  updateCanvas(code: string, participantId: string, strokes: Stroke[]) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/canvas`, {
      method: "POST",
      body: JSON.stringify({ participantId, strokes })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/canvas/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  endRound(code: string, participantId: string) {
    return request<RoundEndResponse>(`/rooms/${encodeURIComponent(code)}/round/end`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  restartGame(code: string, participantId: string) {
    return request<RestartResponse>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
