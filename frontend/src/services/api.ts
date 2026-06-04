export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
  penDown?: boolean;
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  guess: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ParticipantScore {
  participantId: string;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "finished";

  participants: Participant[];

  hostId: string;
  drawerId?: string;

  availableWords: string[];
  roles: ParticipantRole[];

  secretWord?: string;

  drawing: DrawingPoint[];
  guesses: GuessEntry[];
  scores: ParticipantScore[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

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

  submitGuess(code: string, participantId: string, guess: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/guess`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, guess })
      }
    );
  },

  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start`,
      {
        method: "POST",
        body: JSON.stringify({ participantId })
      }
    );
  },

  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/restart`,
      {
        method: "POST",
        body: JSON.stringify({ participantId })
      }
    );
  },

  saveDrawing(code: string, participantId: string, points: DrawingPoint[]) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/drawing`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, points })
      }
    );
  },

  clearDrawing(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/drawing/clear`,
      {
        method: "POST",
        body: JSON.stringify({ participantId })
      }
    );
  }
};