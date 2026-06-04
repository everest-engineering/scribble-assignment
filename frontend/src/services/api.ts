export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "in-game" | "ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isDrawer: boolean;
}

export interface Guess {
  playerId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  isHost: boolean;
  participants: Participant[];
  currentWord: string | null;
  canvasData: any;
  guessHistory: Guess[];
  scoreboard: Record<string, number>;
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/bug";

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
  // ... existing methods
  getCurrentDrawer(room: RoomSnapshot) {
    return room.participants.find((p) => p.isDrawer);
  },
  createRoom(playerName: string) {
// ...

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
    return request<{ success: boolean }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      headers: {
        "x-participant-id": participantId
      }
    });
  },
  endGame(code: string, participantId: string) {
    return request<{ success: boolean }>(`/rooms/${encodeURIComponent(code)}/end`, {
      method: "POST",
      headers: {
        "x-participant-id": participantId
      }
    });
  },
  restartGame(code: string, participantId: string) {
    return request<{ success: boolean }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      headers: {
        "x-participant-id": participantId
      }
    });
  },
  submitGuess(code: string, participantId: string, guess: string) {
    return request<{ success: boolean; isCorrect: boolean; pointsAwarded: number }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-participant-id": participantId
      },
      body: JSON.stringify({ guess })
    });
  },
  updateCanvas(code: string, participantId: string, drawingEvents: any) {
    return request<{ success: boolean }>(`/rooms/${encodeURIComponent(code)}/canvas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-participant-id": participantId
      },
      body: JSON.stringify({ drawingEvents })
    });
  }
};
