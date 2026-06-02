export type ParticipantRole = "drawer" | "guesser";
export type ViewerRole = "drawer" | "guesser" | "unknown";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  color: string;
  size: number;
  points: DrawingPoint[];
}

export interface Guess {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  isCorrect: boolean;
  pointsAwarded: number;
  createdAt: string;
}

export interface ScoreEntry {
  participantId: string;
  participantName: string;
  score: number;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface RoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
  canvas?: {
    strokes: DrawingStroke[];
    updatedAt: string;
  };
  guesses?: Guess[];
}

export interface CompletedRoundSnapshot {
  roundNumber: number;
  drawerParticipantId: string;
  drawerName: string;
  secretWord: string;
  canvas: {
    strokes: DrawingStroke[];
    updatedAt: string;
  };
  guesses: Guess[];
  scores: ScoreEntry[];
  startedAt: string;
  endedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "inGame" | "result";
  participants: Participant[];
  hostParticipantId: string | null;
  viewerParticipantId: string | null;
  isHost: boolean;
  canStart: boolean;
  availableWords: string[];
  roles: ParticipantRole[];
  currentRound?: RoundSnapshot;
  completedRound?: CompletedRoundSnapshot;
  viewerRole: ViewerRole;
  isDrawer: boolean;
  secretWord?: string;
  scores?: ScoreEntry[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

export interface StartGameResponse {
  room: RoomSnapshot;
}

export interface EndRoundRequest {
  participantId: string;
}

export interface RestartRoomRequest {
  participantId: string;
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
  startRoom(code: string, participantId: string) {
    return request<StartGameResponse>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },

  submitDrawingStroke(code: string, participantId: string, stroke: { color: string; size: number; points: { x: number; y: number }[] }) {
    return request<StartGameResponse>(`/rooms/${encodeURIComponent(code)}/drawing`, {
      method: "POST",
      body: JSON.stringify({ participantId, stroke })
    });
  },

  clearDrawing(code: string, participantId: string) {
    return request<StartGameResponse>(`/rooms/${encodeURIComponent(code)}/drawing/clear`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },

  submitGuess(code: string, participantId: string, guess: string) {
    return request<StartGameResponse>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, guess })
    });
  },

  endRound(code: string, participantId: string) {
    return request<StartGameResponse>(`/rooms/${encodeURIComponent(code)}/round/end`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },

  restartRoom(code: string, participantId: string) {
    return request<StartGameResponse>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};
