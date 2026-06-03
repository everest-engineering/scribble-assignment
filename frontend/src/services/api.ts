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

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
}

export interface GuessSnapshot {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ScoreSnapshot {
  participantId: string;
  name: string;
  score: number;
}

export interface RoundSnapshot {
  roundIndex: number;
  drawerParticipantId: string;
  secretWord: string | null;
  strokes: Stroke[];
  guesses: GuessSnapshot[];
  scores: ScoreSnapshot[];
  winnerParticipantId: string | null;
}

export interface ViewerSnapshot {
  participantId: string;
  isDrawer: boolean;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "result";
  hostParticipantId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: RoundSnapshot;
  viewer?: ViewerSnapshot;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export interface StrokeInput {
  points: Point[];
  color?: string;
  width?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

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
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start`,
      {
        method: "POST",
        body: JSON.stringify({ participantId }),
      },
    );
  },
  appendStroke(code: string, participantId: string, stroke: StrokeInput) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/strokes`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, ...stroke }),
      },
    );
  },
  clearStrokes(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/strokes/clear`,
      {
        method: "POST",
        body: JSON.stringify({ participantId }),
      },
    );
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/guess`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, text }),
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
  fetchRoom(code: string, participantId?: string) {
    const query = participantId
      ? `?participantId=${encodeURIComponent(participantId)}`
      : "";
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}${query}`,
    );
  },
};
