export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
  submittedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "active" | "completed";
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  scores: Record<string, number>;
  guesses: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api";

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
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start?participantId=${encodeURIComponent(participantId)}`,
      { method: "POST" }
    );
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ guess: Guess; scoreAwarded: number; room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/guess`,
      {
        method: "POST",
        body: JSON.stringify({ participantId, text })
      }
    );
  }
};
