export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "playing" | "round_end" | "game_over";

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role?: ParticipantRole;
}

export interface Guess {
  participantId: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface RoundResult {
  secretWord: string;
  scores: Record<string, number>;
  roundScores: Record<string, number>;
  correctGuessers: string[];
  allCorrect: boolean;
  endedEarly: boolean;
  roundNumber: number;
}

export interface FinalStanding {
  participantId: string;
  name: string;
  score: number;
  rank: number;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  availableWords: string[];
  roles: ParticipantRole[];
  secretWord?: string;
  scores?: Record<string, number>;
  guessLog?: Guess[];
  roundEnded?: boolean;
  roundCounter?: number;
  maxRounds?: number;
  roundResult?: RoundResult;
  finalStandings?: FinalStanding[];
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

export interface StrokeData {
  color: string;
  points: { x: number; y: number }[];
}

export interface GuessResult {
  correct: boolean;
  points: number;
  alreadyGuessed: boolean;
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
  leaveRoom(code: string, participantId: string) {
    return request<{ left: boolean; hostTransferred: boolean; newHostId: string | null }>(`/rooms/${encodeURIComponent(code)}/leave`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  submitDraw(code: string, participantId: string, color: string, points: { x: number; y: number }[]) {
    return request<{ strokeCount: number }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "POST",
      body: JSON.stringify({ participantId, color, points })
    });
  },
  clearCanvas(code: string, participantId: string) {
    return request<{ cleared: boolean }>(`/rooms/${encodeURIComponent(code)}/draw`, {
      method: "DELETE",
      body: JSON.stringify({ participantId })
    });
  },
  fetchCanvas(code: string, participantId: string) {
    const query = `?participantId=${encodeURIComponent(participantId)}`;
    return request<{ strokes: StrokeData[] }>(`/rooms/${encodeURIComponent(code)}/canvas${query}`);
  },
  submitGuess(code: string, participantId: string, text: string) {
    return request<GuessResult>(`/rooms/${encodeURIComponent(code)}/guess`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
  },
  endRound(code: string, participantId: string) {
    return request<{ ended: boolean }>(`/rooms/${encodeURIComponent(code)}/end-round`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  returnToLobby(code: string, participantId: string) {
    return request<{ transitioned: boolean; status: string }>(`/rooms/${encodeURIComponent(code)}/return-to-lobby`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  startNewRound(code: string, participantId: string) {
    return request<{ started: boolean; roundNumber: number; maxRounds: number }>(`/rooms/${encodeURIComponent(code)}/start-round`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
};
