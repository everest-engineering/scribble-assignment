export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "drawing" | "result";

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasStroke {
  points: CanvasPoint[];
  color?: string;
  width?: number;
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface RoomParticipantSnapshot {
  id: string;
  name: string;
  joinedAt: string;
  isHost: boolean;
  role?: ParticipantRole;
  score?: number;
}

export interface RoomViewer {
  participantId: string;
  isHost: boolean;
  canStart: boolean;
  role?: ParticipantRole;
  secretWord?: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostParticipantId: string;
  roundNumber?: number;
  drawerParticipantId?: string;
  participants: RoomParticipantSnapshot[];
  canvasStrokes?: CanvasStroke[];
  guesses?: Guess[];
  revealedWord?: string;
  viewer?: RoomViewer;
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
      body: JSON.stringify({ playerName: playerName.trim() })
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(
      `/rooms/${encodeURIComponent(code.trim().toUpperCase())}/join`,
      {
        method: "POST",
        body: JSON.stringify({ playerName: playerName.trim() })
      }
    );
  },
  fetchRoom(code: string, participantId: string) {
    const query = `?participantId=${encodeURIComponent(participantId)}`;
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}${query}`
    );
  },
  startGame(code: string, participantId: string) {
    const query = `?participantId=${encodeURIComponent(participantId)}`;
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/start${query}`,
      { method: "POST" }
    );
  },
  updateCanvas(code: string, participantId: string, strokes: CanvasStroke[]) {
    const query = `?participantId=${encodeURIComponent(participantId)}`;
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/canvas${query}`,
      {
        method: "PUT",
        body: JSON.stringify({ strokes })
      }
    );
  },
  submitGuess(code: string, participantId: string, text: string) {
    const query = `?participantId=${encodeURIComponent(participantId)}`;
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/guesses${query}`,
      {
        method: "POST",
        body: JSON.stringify({ text })
      }
    );
  },
  restartGame(code: string, participantId: string) {
    const query = `?participantId=${encodeURIComponent(participantId)}`;
    return request<{ room: RoomSnapshot }>(
      `/rooms/${encodeURIComponent(code)}/restart${query}`,
      { method: "POST" }
    );
  }
};
