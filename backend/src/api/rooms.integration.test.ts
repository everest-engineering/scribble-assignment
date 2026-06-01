import http from "node:http";
import { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("rooms API integration", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = http.createServer(createApp());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

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

  it("supports the full game flow from lobby to result and restart", async () => {
    const createResponse = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Alice" }),
    });
    expect(createResponse.ok).toBe(true);

    const createBody = await createResponse.json();
    const roomCode = createBody.room.code as string;
    const hostId = createBody.participantId as string;

    const joinResponse = await fetch(`${baseUrl}/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Bob" }),
    });
    expect(joinResponse.ok).toBe(true);

    const joinBody = await joinResponse.json();
    const guesserId = joinBody.participantId as string;

    const startResponse = await fetch(`${baseUrl}/rooms/${roomCode}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: hostId }),
    });
    expect(startResponse.ok).toBe(true);

    const startBody = await startResponse.json();
    expect(startBody.room.status).toBe("active");
    expect(startBody.room.drawerId).toBe(hostId);
    expect(typeof startBody.room.secretWord).toBe("string");

    const correctGuessResponse = await fetch(`${baseUrl}/rooms/${roomCode}/guess`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: guesserId, guess: startBody.room.secretWord }),
    });
    expect(correctGuessResponse.ok).toBe(true);

    const guessBody = await correctGuessResponse.json();
    expect(guessBody.room.status).toBe("results");
    expect(guessBody.room.guesses).toHaveLength(1);
    expect(guessBody.room.guesses[0].correct).toBe(true);
    expect(guessBody.room.scores[guesserId]).toBe(100);
    expect(guessBody.room.secretWord).toBe(startBody.room.secretWord);

    const restartResponse = await fetch(`${baseUrl}/rooms/${roomCode}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: hostId }),
    });
    expect(restartResponse.ok).toBe(true);

    const restartBody = await restartResponse.json();
    expect(restartBody.room.status).toBe("lobby");
    expect(restartBody.room.guesses).toHaveLength(0);
    expect(restartBody.room.drawingPaths).toHaveLength(0);
    expect(restartBody.room.participants).toHaveLength(2);
    expect(restartBody.room.scores[guesserId]).toBe(100);
  });
});
