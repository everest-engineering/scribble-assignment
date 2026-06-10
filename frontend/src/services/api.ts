export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Guess {
  playerName: string;
  text: string;
  correct: boolean;
  points: number;
  submittedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "result";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  drawerName?: string;
  secretWord?: string;
  guesses: Guess[];
  scores: Record<string, number>;
  strokes: Point[][];
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
  startRoom(code: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST"
    });
  },
  submitGuess(code: string, playerName: string, guess: string) {
    return request<{ guess: Guess }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ playerName, guess })
    });
  },
  addStroke(code: string, points: Point[]) {
    return request<{ strokes: Point[][] }>(`/rooms/${encodeURIComponent(code)}/stroke`, {
      method: "POST",
      body: JSON.stringify({ points })
    });
  },
  clearStrokes(code: string) {
    return request<{ strokes: Point[][] }>(`/rooms/${encodeURIComponent(code)}/clear`, {
      method: "POST"
    });
  },
  endGame(code: string, playerName: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/end`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  restartGame(code: string, playerName: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  }
};
