export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
  isHost?: boolean;
  score?: number;
}

export interface Guess {
  id: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  scoreAwarded: number;
  timestamp: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "game" | "result";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
  drawingData?: string;
  guesses?: Guess[];
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
    return request<{ success: boolean; status: string }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  leaveRoom(code: string, participantId: string) {
    return request<{ success: boolean; message: string }>(`/rooms/${encodeURIComponent(code)}/leave`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  updateDrawing(code: string, drawingData: string) {
    return request<{ success: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas`, {
      method: "POST",
      body: JSON.stringify({ drawingData })
    });
  },
  clearDrawing(code: string) {
    return request<{ success: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas/clear`, {
      method: "POST"
    });
  },
  submitGuess(code: string, participantId: string, guessText: string) {
    return request<{ success: boolean; guess: Guess }>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, guessText })
    });
  },
  endRound(code: string, participantId: string) {
    return request<{ success: boolean; status: string }>(`/rooms/${encodeURIComponent(code)}/end`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  restartGame(code: string, participantId: string) {
    return request<{ success: boolean; status: string }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
