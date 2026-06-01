export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface Guess {
  participantId: string;
  participantName: string;
  guess: string;
  correct: boolean;
  createdAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "active" | "results";
  participants: Participant[];
  drawerId?: string;
  secretWord?: string;
  scores: Record<string, number>;
  guesses: Guess[];
  drawingPaths: DrawingPath[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
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
      body: JSON.stringify({ playerName }),
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(
      `/rooms/${encodeURIComponent(code)}/join`,
      {
        method: "POST",
        body: JSON.stringify({ playerName }),
      },
    );
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId
      ? `?participantId=${encodeURIComponent(participantId)}`
      : "";
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}${query}`,
    );
  },
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start`,
      {
        method: "POST",
        body: JSON.stringify({ participantId }),
      },
    );
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/restart`,
      {
        method: "POST",
        body: JSON.stringify({ participantId }),
      },
    );
  },
  submitGuess(code: string, participantId: string, guess: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/guess`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, guess }),
      },
    );
  },
  appendDrawing(code: string, participantId: string, path: DrawingPath) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/drawing`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, path }),
      },
    );
  },
  clearDrawing(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/drawing`,
      {
        method: "DELETE",
        body: JSON.stringify({ participantId }),
      },
    );
  },
};
