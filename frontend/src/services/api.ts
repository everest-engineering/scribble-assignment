export type ParticipantRole = "drawer" | "guesser";
export type LobbyParticipantRole = "host" | "player";
export type RoomStatus = "lobby" | "playing" | "result";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role: LobbyParticipantRole;
}

export interface GuessEntry {
  id: string;
  participantId: string;
  text: string;
  submittedAt: string;
  isCorrect: boolean;
}

export interface ScoreEntry {
  participantId: string;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  drawerId?: string;
  viewerRole?: ParticipantRole;
  secretWord?: string;
  guessHistory?: GuessEntry[];
  scores?: ScoreEntry[];
  winnerId?: string;
}

export interface RoomSessionResponse {
  participantId: string;
  sessionId: string;
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
    const sessionId = sessionStorage.getItem(ROOM_SESSION_ID_STORAGE_KEY);
    const query =
      participantId && sessionId
        ? `?participantId=${encodeURIComponent(participantId)}&sessionId=${encodeURIComponent(sessionId)}`
        : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  startRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({
        participantId,
        sessionId: sessionStorage.getItem(ROOM_SESSION_ID_STORAGE_KEY)
      })
    });
  },
  submitGuess(code: string, participantId: string, guessText: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({
        participantId,
        sessionId: sessionStorage.getItem(ROOM_SESSION_ID_STORAGE_KEY),
        guessText
      })
    });
  },
  restartRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({
        participantId,
        sessionId: sessionStorage.getItem(ROOM_SESSION_ID_STORAGE_KEY)
      })
    });
  }
};
