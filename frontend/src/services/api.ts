import {
  roomResponseSchema,
  roomSessionResponseSchema,
  type RoomResponse,
  type RoomSessionResponse,
  type RoomSnapshot
} from "shared/schemas/index.js";

export type { RoomSessionResponse, RoomSnapshot, RoomResponse };

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
  }
};
