export type ParticipantRole = "drawer" | "guesser";

export interface Point {
  x: number;
  y: number;
}

export interface GuessEntry {
  guesserName: string;
  guessText: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundResult {
  revealedWord: string;
  scores: Record<string, number>;
  guesses: GuessEntry[];
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "in-progress" | "finished";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  secretWord?: string;
  result?: RoundResult;
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
  submitGuess(code: string, participantId: string, guessText: string) {
    return request<{ guess: GuessEntry; newScore: number }>(
      `/rooms/${encodeURIComponent(code)}/guesses`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, guessText })
      }
    );
  },
  fetchGuesses(code: string) {
    return request<{ guesses: GuessEntry[]; scores: Record<string, number> }>(
      `/rooms/${encodeURIComponent(code)}/guesses`
    );
  },
  saveStroke(code: string, path: Point[]) {
    return request<{ ok: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas/strokes`, {
      method: "POST",
      body: JSON.stringify({ path })
    });
  },
  clearCanvas(code: string) {
    return request<{ ok: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas`, {
      method: "DELETE"
    });
  },
  fetchCanvas(code: string) {
    return request<{ strokes: Point[][] }>(`/rooms/${encodeURIComponent(code)}/canvas`);
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
