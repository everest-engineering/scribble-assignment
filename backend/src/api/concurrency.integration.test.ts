import http from "node:http";
import { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("rooms API concurrency", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = http.createServer(createApp());
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to bind test server");
    }

    baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });

  it("handles concurrent join requests gracefully", async () => {
    // Create a room
    const createResponse = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Host" }),
    });
    const { room } = await createResponse.json();
    const roomCode = room.code;

    // Join concurrently
    const joinPromises = Array.from({ length: 5 }).map((_, i) =>
      fetch(`${baseUrl}/rooms/${roomCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: `Player ${i}` }),
      }),
    );

    const responses = await Promise.all(joinPromises);
    for (const res of responses) {
      expect(res.ok).toBe(true);
    }

    // Verify room state
    const finalResponse = await fetch(`${baseUrl}/rooms/${roomCode}`);
    const finalBody = await finalResponse.json();

    // 1 host + 5 joiners = 6 participants
    expect(finalBody.room.participants).toHaveLength(6);
    
    // Verify all names are present
    const names = finalBody.room.participants.map((p: any) => p.name);
    expect(names).toContain("Host");
    for (let i = 0; i < 5; i++) {
      expect(names).toContain(`Player ${i}`);
    }
  });
});
