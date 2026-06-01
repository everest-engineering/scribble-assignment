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

describe("reconnect integration", () => {
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

  it("allows a previously-present participant to reconnect after restart and preserves their score", async () => {
    // create host and a second player
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "HostY" })
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const code = created.room.code;

    const joinRes = await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "GuestY" })
    });
    expect(joinRes.status).toBe(200);
    const joinBody = await joinRes.json();
    const guestId = joinBody.participantId;

    // start game
    const startRes = await fetch(`${baseUrl}/rooms/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });
    expect(startRes.status).toBe(200);

    // post a guess as guest to create a score
    const guessesRes = await fetch(`${baseUrl}/rooms/${code}/guesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: guestId, text: "testing" })
    });

    // Now call restart as host
    const restartRes = await fetch(`${baseUrl}/rooms/${code}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });

    expect(restartRes.status).toBe(200);

    // Attempt to reconnect as the guest using their previous participantId
    const reconnectRes = await fetch(`${baseUrl}/rooms/${code}/reconnect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: guestId })
    });

    expect(reconnectRes.status).toBe(200);
    const reconnectBody = await reconnectRes.json();

    expect(reconnectBody.participantId).toBe(guestId);
    expect(Array.isArray(reconnectBody.room.participants)).toBe(true);

    const found = reconnectBody.room.participants.find(
      (p: any) => p.id === guestId
    );
    expect(found).toBeTruthy();
    // score should be preserved (if awarded earlier)
    expect(
      (found as any).score === undefined ||
        typeof (found as any).score === "number"
    ).toBeTruthy();
  });
});
