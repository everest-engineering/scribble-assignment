export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export type CanvasAction =
  | { type: "stroke"; points: { x: number; y: number }[]; color: string; width: number; timestamp: string }
  | { type: "clear"; timestamp: string };

export type CanvasActionSubmission =
  | { type: "stroke"; points: { x: number; y: number }[]; color: string; width: number; timestamp?: string }
  | { type: "clear"; timestamp?: string };

export interface GuessEntry {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  drawerId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
  canvasActions: CanvasAction[];
  guessHistory: GuessEntry[];
  scores: Record<string, number>;
  roundOver: boolean;
}

export interface GuessResponse {
  correct: boolean;
  score: number;
  guessId: string;
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
  submitCanvasAction(code: string, playerId: string, action: CanvasActionSubmission) {
    return request<{ ok: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas?playerId=${encodeURIComponent(playerId)}`, {
      method: "POST",
      body: JSON.stringify(action)
    });
  },
  submitGuess(code: string, playerId: string, text: string) {
    return request<GuessResponse>(`/rooms/${encodeURIComponent(code)}/guess?playerId=${encodeURIComponent(playerId)}`, {
      method: "POST",
      body: JSON.stringify({ text })
    });
  }
};
