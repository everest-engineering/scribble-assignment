export type ParticipantRole = "drawer" | "guesser" | "host";
export type RoomStatus = "lobby" | "game";
export type RoundStatus = "SelectingWord" | "Drawing" | "Ended";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
}

export interface Round {
  drawerId: string;
  wordOptions?: string[]; // Optional since it's hidden from Guessers
  secretWord?: string | null; // Optional since it's hidden from Guessers
  roundStatus: RoundStatus;
  roundEndTime: number | null;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  currentRound?: Round;
  availableWords: string[];
  roles: ParticipantRole[];
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
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  selectWord(code: string, participantId: string, word: string) {
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(code)}/word`, {
      method: "POST",
      body: JSON.stringify({ participantId, word })
    });
  }
};
