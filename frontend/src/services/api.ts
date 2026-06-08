export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  lastSeenAt?: string;
  // Points this game (0 at round start; +100 per first correct guess). FR-005, FR-006
  score: number;
}

// Viewer-facing guess projection. `text` is present ONLY for incorrect guesses;
// a correct guess omits it so the word never leaks through the feed (FR-011).
export interface GuessSnapshot {
  id: string;
  playerId: string;
  playerName: string;
  correct: boolean;
  text?: string;
}

// Viewer-facing round projection. `word` is present ONLY when the viewer is the
// drawer; guessers receive just `wordLength`/`maskedWord` (FR-006, FR-007, FR-008).
export interface RoundSnapshot {
  number: number;
  drawerId: string;
  wordLength: number;
  maskedWord: string;
  word?: string;
  // Ordered guess history; correct entries omit `text`. FR-008, FR-010, FR-011
  guesses: GuessSnapshot[];
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  hostId: string;
  participants: Participant[];
  round: RoundSnapshot | null;
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// Carries the HTTP status so callers can distinguish a closed room (404 during
// polling) from a transient failure, and show specific join-error messages.
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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

    throw new ApiError(response.status, errorBody.message ?? "Request failed");
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
  startRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  }
};
