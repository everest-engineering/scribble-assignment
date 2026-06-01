export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "in-game";
  hostId?: string;
  // id of the drawer for the active round (if any)
  drawerId?: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  // secret word is present only for the drawer viewing their own room snapshot
  secretWord?: string;
  // immutable canvas events for rehydration and read-only viewers
  canvasEvents?: unknown[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export interface RoundSummary {
  word?: string;
  drawerId?: string;
  finalScores?: Array<{ participantId: string; score?: number }>;
  guesses?: Array<{
    playerId: string;
    textTrimmed: string;
    timestamp: string;
    isCorrect: boolean;
  }>;
  endedAt?: string;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => ({ message: "Request failed" }))) as {
      message?: string;
      code?: string;
    };

    const err = new Error(errorBody.message ?? "Request failed");
    // attach HTTP status and machine code for the UI to provide friendlier feedback
    (err as any).status = response.status;
    (err as any).code = (errorBody as any).code;
    // log for debugging
    // eslint-disable-next-line no-console
    console.error("API request failed", {
      path,
      status: response.status,
      body: errorBody
    });
    throw err;
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
    return request<RoomSessionResponse>(
      `/rooms/${encodeURIComponent(code)}/join`,
      {
        method: "POST",
        body: JSON.stringify({ playerName })
      }
    );
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId
      ? `?participantId=${encodeURIComponent(participantId)}`
      : "";
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}${query}`
    );
  },
  startRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start`,
      {
        method: "POST",
        body: JSON.stringify({ participantId })
      }
    );
  },
  postGuess(code: string, participantId: string, text: string) {
    return request<{ guess: unknown }>(
      `/rooms/${encodeURIComponent(code)}/guesses`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, text })
      }
    );
  },
  fetchGuesses(code: string) {
    return request<{ guesses: unknown[] }>(
      `/rooms/${encodeURIComponent(code)}/guesses`
    );
  },
  postCanvasEvent(code: string, participantId: string, event: any) {
    return request<{ ok: boolean }>(
      `/rooms/${encodeURIComponent(code)}/canvas-events`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, event })
      }
    );
  },
  getLastRoundSummary(code: string) {
    return request<{ lastRoundSummary: RoundSummary | null }>(
      `/rooms/${encodeURIComponent(code)}/last-round-summary`
    );
  },
  reconnect(code: string, participantId: string) {
    return request<RoomSessionResponse>(
      `/rooms/${encodeURIComponent(code)}/reconnect`,
      {
        method: "POST",
        body: JSON.stringify({ participantId })
      }
    );
  }
};
