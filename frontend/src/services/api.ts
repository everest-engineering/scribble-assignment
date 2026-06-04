export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Guess {
  playerId: string;
  playerName: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "result";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
  isDrawer: boolean;
  canvasData: string;
  guesses: Guess[];
  scores: Record<string, number>;
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
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start?participantId=${encodeURIComponent(participantId)}`,
      { method: "POST" }
    );
  },
  draw(code: string, participantId: string, data: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/draw?participantId=${encodeURIComponent(participantId)}`,
      {
        method: "POST",
        body: JSON.stringify({ data })
      }
    );
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/guess?participantId=${encodeURIComponent(participantId)}`,
      {
        method: "POST",
        body: JSON.stringify({ text })
      }
    );
  },
  endRound(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/end?participantId=${encodeURIComponent(participantId)}`,
      { method: "POST" }
    );
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/restart?participantId=${encodeURIComponent(participantId)}`,
      { method: "POST" }
    );
  },
  nextRound(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/next-round?participantId=${encodeURIComponent(participantId)}`,
      { method: "POST" }
    );
  }
};
