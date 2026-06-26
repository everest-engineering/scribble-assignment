export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  guess: string;
  correct: boolean;
  timestamp: string;
  roundScoreAfter: number;
  cumulativeScoreAfter: number;
}

export interface ParticipantScore {
  roundScore: number;
  cumulativeScore: number;
}

export interface RoundResult {
  roundNumber: number;
  secretWord: string;
  drawerId: string;
  drawerName: string;
  guessHistory: GuessEntry[];
  scores: Record<string, ParticipantScore>;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: number;
  drawerId?: string;
  secretWord?: string;
  strokes: DrawingStroke[];
  guessHistory: GuessEntry[];
  scores: Record<string, ParticipantScore>;
  lastRoundResult?: RoundResult;
}

export interface GuessResponse {
  correct: boolean;
  message: string;
  guessEntry: GuessEntry;
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
  startRoom(code: string, playerId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ playerId })
    });
  },
  addStrokes(code: string, participantId: string, strokes: DrawingStroke[]) {
    return request<{ strokes: DrawingStroke[] }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "POST",
      body: JSON.stringify({ participantId, strokes })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ strokes: DrawingStroke[] }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "DELETE",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, guess: string) {
    return request<GuessResponse>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, guess })
    });
  }
};
