import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { clearRooms } from "../services/roomStore.js";

let server: Server;
let baseUrl: string;

function jsonRequest(path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });
}

beforeEach(() => {
  clearRooms();
  server = createApp().listen(0);
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to start test server");
  }

  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

describe("rooms API", () => {
  it("rejects create requests with blank player names", async () => {
    const response = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: " " })
    });

    expect(response.status).toBe(400);
  });

  it("creates, fetches, and starts a room with host validation", async () => {
    const createResponse = await jsonRequest("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName: "Alice" })
    });
    const createBody = (await createResponse.json()) as {
      participantId: string;
      room: { code: string; hostParticipantId: string; isHost: boolean; canStart: boolean };
    };

    expect(createResponse.status).toBe(201);
    expect(createBody.room.hostParticipantId).toBe(createBody.participantId);
    expect(createBody.room.isHost).toBe(true);
    expect(createBody.room.canStart).toBe(false);

    const joinResponse = await jsonRequest(`/rooms/${createBody.room.code.toLowerCase()}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const joinBody = (await joinResponse.json()) as { participantId: string };

    expect(joinResponse.status).toBe(200);

    const nonHostStart = await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: joinBody.participantId })
    });

    expect(nonHostStart.status).toBe(403);

    const hostFetch = await jsonRequest(`/rooms/${createBody.room.code}?participantId=${createBody.participantId}`);
    const hostFetchBody = (await hostFetch.json()) as { room: { isHost: boolean; canStart: boolean } };

    expect(hostFetchBody.room.isHost).toBe(true);
    expect(hostFetchBody.room.canStart).toBe(true);

    const hostStart = await jsonRequest(`/rooms/${createBody.room.code}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId: createBody.participantId })
    });
    const hostStartBody = (await hostStart.json()) as { room: { status: string; canStart: boolean } };

    expect(hostStart.status).toBe(200);
    expect(hostStartBody.room.status).toBe("inGame");
    expect(hostStartBody.room.canStart).toBe(false);
  });

  it("rejects malformed and unknown join room codes", async () => {
    const malformed = await jsonRequest("/rooms/BAD/join", {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });
    const unknown = await jsonRequest("/rooms/ZZZZ/join", {
      method: "POST",
      body: JSON.stringify({ playerName: "Bob" })
    });

    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
  });
});
