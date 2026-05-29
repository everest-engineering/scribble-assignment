export type ParticipantRole = "drawer" | "guesser";

export interface Participant {
  isHost: boolean;
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "playing";
  participants: Participant[];
  availableWords: string[];
  roles: ParticipantRole[];
  currentDrawerId?: string;
  currentWord?: string;
  guesses: {
  id: string;
  participantId: string;
  playerName: string;
  message: string;
  isCorrect: boolean;
  createdAt: string;
}[];

canvasLines: string[];
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
  startGame(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start${query}`, {
      method: "POST"
    });
  },
  submitGuess(code: string, participantId: string, message: string) {
  return request<{ room: RoomSnapshot }>(
    `/rooms/${encodeURIComponent(code)}/guess?participantId=${encodeURIComponent(participantId)}`,
    {
      method: "POST",
      body: JSON.stringify({ message })
    }
  );
},
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  }
};
