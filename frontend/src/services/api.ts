import {
  guessSnapshotSchema,
  roomResponseSchema,
  roomSessionResponseSchema,
  type GuessSnapshot,
  type RoomResponse,
  type RoomSessionResponse,
  type RoomSnapshot
} from "shared/schemas/index.js";

export type { GuessSnapshot, RoomSessionResponse, RoomSnapshot, RoomResponse };

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
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
  async createRoom(playerName: string): Promise<RoomSessionResponse> {
    const raw = await request<unknown>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
    return roomSessionResponseSchema.parse(raw);
  },

  async joinRoom(code: string, playerName: string): Promise<RoomSessionResponse> {
    const raw = await request<unknown>(`/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
    return roomSessionResponseSchema.parse(raw);
  },

  async fetchRoom(code: string, participantId?: string): Promise<RoomResponse> {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    const raw = await request<unknown>(`/rooms/${encodeURIComponent(code)}${query}`);
    return roomResponseSchema.parse(raw);
  },

  async startGame(code: string, participantId: string): Promise<RoomResponse> {
    const raw = await request<unknown>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
    return roomResponseSchema.parse(raw);
  },

  // T021: updateCanvas — PUT /rooms/:code/canvas
  async updateCanvas(code: string, participantId: string, canvasDataUrl: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(code)}/canvas`, {
      method: "PUT",
      body: JSON.stringify({ participantId, canvasDataUrl })
    });
  },

  // T022: clearCanvas — DELETE /rooms/:code/canvas
  async clearCanvas(code: string, participantId: string): Promise<void> {
    await request<void>(`/rooms/${encodeURIComponent(code)}/canvas`, {
      method: "DELETE",
      body: JSON.stringify({ participantId })
    });
  },

  // T036: submitGuess — POST /rooms/:code/guesses
  async submitGuess(code: string, participantId: string, text: string): Promise<GuessSnapshot> {
    const raw = await request<unknown>(`/rooms/${encodeURIComponent(code)}/guesses`, {
      method: "POST",
      body: JSON.stringify({ participantId, text })
    });
    const parsed = (raw as { guess: unknown }).guess;
    return guessSnapshotSchema.parse(parsed);
  }
};
