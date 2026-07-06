export type ParticipantRole = "drawer" | "guesser";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
}

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  pointsAwarded: number;
  timestamp: string;
}

export type ScoreMap = Record<string, number>;

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "drawing" | "result";
  hostId: string;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound: number;
  currentDrawerId: string;
  secretWord: string | null;
  scores: ScoreMap;
  guesses: Guess[];
  canvasStrokes: Stroke[];
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
  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start?participantId=${encodeURIComponent(participantId)}`, {
      method: "POST"
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  submitGuess(code: string, participantId: string, guess: string) {
    return request<{ room: RoomSnapshot; message?: string }>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, guess })
    });
  },
  nextWord(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/next-word?participantId=${encodeURIComponent(participantId)}`, {
      method: "POST"
    });
  },
  submitCanvasStroke(code: string, participantId: string, stroke: { points: Point[] }) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/canvas?participantId=${encodeURIComponent(participantId)}`, {
      method: "POST",
      body: JSON.stringify({ type: "stroke", stroke })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/canvas?participantId=${encodeURIComponent(participantId)}`, {
      method: "POST",
      body: JSON.stringify({ type: "clear" })
    });
  },
  endGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/end-game?participantId=${encodeURIComponent(participantId)}`, {
      method: "POST"
    });
  },
  restartGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart?participantId=${encodeURIComponent(participantId)}`, {
      method: "POST"
    });
  }
};
