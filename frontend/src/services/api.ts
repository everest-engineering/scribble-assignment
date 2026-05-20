export type ParticipantRole = "drawer" | "guesser";

export interface CanvasStroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

export interface GuessSnapshot {
  participantId: string;
  guesserName: string;
  text: string;
  submittedAt: string;
  isCorrect: boolean;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundSnapshot {
  number: number;
  drawerId: string;
  secretWord?: string;
  status: "drawing";
  strokes: CanvasStroke[];
  guesses: GuessSnapshot[];
  scores: Record<string, number>;
  correctGuessers: string[];
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "active";
  hostId: string;
  participants: Participant[];
  currentRound: RoundSnapshot | null;
  availableWords: string[];
  roles: ParticipantRole[];
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
  draw(code: string, participantId: string, strokes: CanvasStroke[]) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "POST",
      body: JSON.stringify({ participantId, strokes })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return this.draw(code, participantId, []);
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ guess: GuessSnapshot; room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  }
};
