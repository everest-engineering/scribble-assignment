export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Point {
  x: number;
  y: number;
}

export type Stroke = Point[];

export interface Guess {
  id: string;
  participantId: string;
  text: string;
  correct: boolean;
  submittedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  currentWord?: string | null;
  strokes?: Stroke[];
  guesses?: Guess[];
  scores?: Record<string, number>;
  revealedWord?: string;
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
  startRoom(code: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
  },
  updateCanvas(code: string, participantId: string, strokes: Stroke[]) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/canvas`,
      {
        method: "PATCH",
        body: JSON.stringify({ participantId, strokes }),
      },
    );
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ guess: Guess }>(
      `/rooms/${encodeURIComponent(code)}/guesses`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, text }),
      },
    );
  },
  endRound(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/end`,
      {
        method: "POST",
        body: JSON.stringify({ participantId }),
      },
    );
  },
  restartRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/restart`,
      {
        method: "POST",
        body: JSON.stringify({ participantId }),
      },
    );
  },
};
