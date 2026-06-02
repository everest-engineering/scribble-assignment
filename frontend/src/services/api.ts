export type ParticipantRole = "drawer" | "guesser";

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "result";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId: string | null;
  roundNumber: number;
  secretWord: string | null;
  scores: Record<string, number>;
  guesses: Guess[];
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
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ result: "correct" | "incorrect"; guess: Guess; scores: Record<string, number>; guesses: Guess[]; roomStatus: "lobby" | "playing" | "result" }>(
      `/rooms/${encodeURIComponent(code)}/guess`,
      { method: "POST", body: JSON.stringify({ participantId, text }) }
    );
  },
  fetchCanvas(code: string) {
    return request<{ strokes: Stroke[] }>(`/rooms/${encodeURIComponent(code)}/canvas`);
  },
  saveCanvas(code: string, participantId: string, strokes: Stroke[]) {
    return request<{ ok: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas`, {
      method: "POST",
      body: JSON.stringify({ participantId, strokes })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ ok: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  endRound(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/end-round`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
