export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  points: StrokePoint[];
}

export type GuessResult = "correct" | "incorrect";

export interface Guess {
  participantId: string;
  text: string;
  result: GuessResult;
  timestamp: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];
  roundNumber: number | null;
  drawerId: string | null;
  yourRole: "drawer" | "guesser" | null;
  wordForDrawer: string | undefined;
  wordLength: number | null;
  strokes: Stroke[];
  guesses: Guess[];
  scores: Record<string, number>;
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";

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

export type GuessResponse =
  | { result: "correct"; message: string }
  | { result: "incorrect"; message: string }
  | { result: "already_correct"; message: string };

export const api = {
  submitGuess(code: string, participantId: string, text: string) {
    return request<GuessResponse>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  },
  addStroke(code: string, participantId: string, points: StrokePoint[]) {
    return request<{ ok: boolean }>(`/rooms/${encodeURIComponent(code)}/stroke`, {
      method: "POST",
      body: JSON.stringify({ participantId, points })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ ok: boolean }>(`/rooms/${encodeURIComponent(code)}/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
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
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start?participantId=${encodeURIComponent(participantId)}`, {
      method: "POST",
      body: "{}"
    });
  }
};
