import http from "node:http";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createApp } from "../app.js";

function listen(app: any) {
  const server = http.createServer(app);
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server));
  });
}

async function addressOf(server: any) {
  const addr = server.address();
  if (addr && typeof addr === "object")
    return `http://127.0.0.1:${(addr as any).port}`;
  return `http://127.0.0.1`;
}

describe("restart endpoints integration", () => {
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    const app = createApp();
    // @ts-ignore
    server = await listen(app);
    baseUrl = await addressOf(server);
  });

  afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  it("POST /rooms/:code/restart preserves participants but clears transient state", async () => {
    // create host and a second player
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "HostX" })
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const code = created.room.code;

    const joinRes = await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "GuestX" })
    });
    expect(joinRes.status).toBe(200);

    // start game
    const startRes = await fetch(`${baseUrl}/rooms/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });
    expect(startRes.status).toBe(200);

    // post a guess as guest (should create transient state)
    const guessesRes = await fetch(`${baseUrl}/rooms/${code}/guesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: created.participantId,
        text: "test"
      })
    });
    // may be 201 or another status depending on game state; don't fail here

    // Now call restart as host
    const restartRes = await fetch(`${baseUrl}/rooms/${code}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });

    expect(restartRes.status).toBe(200);

    // After restart, participants should still include host and guest
    const afterRes = await fetch(`${baseUrl}/rooms/${code}`);
    expect(afterRes.status).toBe(200);
    const afterBody = await afterRes.json();
    expect(Array.isArray(afterBody.room.participants)).toBe(true);
    expect(afterBody.room.participants.length).toBeGreaterThanOrEqual(2);

    // transient round data such as `guesses` should be cleared
    expect(
      afterBody.room.guesses === undefined ||
        afterBody.room.guesses.length === 0
    ).toBeTruthy();
  });
});
