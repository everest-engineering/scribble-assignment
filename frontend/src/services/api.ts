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

export interface DrawingStroke {
  color: string;
  width: number;
  points: Point[];
}

export interface Guess {
  participantId: string;
  text: string;
  isCorrect: boolean;
  timestamp: string;
}

export interface PlayerScore {
  participantId: string;
  name: string;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing" | "round_ended";
  hostId: string;
  drawerId: string | null;
  secretWord?: string;
  yourRole: ParticipantRole;
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  strokes: DrawingStroke[];
  clearVersion: number;
  guesses: Guess[];
  scores: PlayerScore[];
  allGuessersCorrect: boolean;
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
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  leaveGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot | null }>(`/rooms/${encodeURIComponent(code)}/leave`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitStrokes(code: string, participantId: string, strokes: DrawingStroke[]) {
    return request<{ strokes: DrawingStroke[]; clearVersion: number }>(`/rooms/${encodeURIComponent(code)}/strokes`, {
      method: "POST",
      body: JSON.stringify({ participantId, action: "append", strokes })
    });
  },
  clearStrokes(code: string, participantId: string) {
    return request<{ strokes: DrawingStroke[]; clearVersion: number }>(`/rooms/${encodeURIComponent(code)}/strokes`, {
      method: "POST",
      body: JSON.stringify({ participantId, action: "clear" })
    });
  },
  fetchStrokes(code: string) {
    return request<{ strokes: DrawingStroke[]; clearVersion: number }>(`/rooms/${encodeURIComponent(code)}/strokes`);
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<{ isCorrect: boolean; allGuessersCorrect: boolean; room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  },
  revealWord(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/reveal`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
