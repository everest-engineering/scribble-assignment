import http from "node:http";
import { describe, it, beforeEach, afterEach, expect } from "vitest";
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

describe("guesses integration", () => {
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    const app = createApp();
    // @ts-ignore
    server = await listen(app);
    baseUrl = await addressOf(server);
  });

  afterEach(async () => {
    if (server) await new Promise((res) => server.close(res));
  });

  it("allows two guessers and records history, scoring and canvas rehydration", async () => {
    // create room as host (drawer will be host for first round)
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Host" })
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const code = created.room.code;
    const hostId = created.participantId;

    // two players join
    const join1 = await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "G1" })
    });
    expect(join1.status).toBe(200);
    const g1 = await join1.json();

    const join2 = await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "G2" })
    });
    expect(join2.status).toBe(200);
    const g2 = await join2.json();

    // start the game as host
    const startRes = await fetch(`${baseUrl}/rooms/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: hostId })
    });
    expect(startRes.status).toBe(200);

    // determine secret word via drawer snapshot
    const drawerSnap = await fetch(
      `${baseUrl}/rooms/${code}?participantId=${hostId}`
    );
    const drawerBody = await drawerSnap.json();
    const secret = drawerBody.room.secretWord;
    expect(secret).toBeDefined();

    // G1 posts wrong guess
    const g1Guess = await fetch(`${baseUrl}/rooms/${code}/guesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: g1.participantId, text: "wrong" })
    });
    expect(g1Guess.status).toBe(201);

    // G2 posts correct guess
    const g2Guess = await fetch(`${baseUrl}/rooms/${code}/guesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: g2.participantId, text: secret })
    });
    expect(g2Guess.status).toBe(201);

    // fetch guesses and assert order and correctness
    const guessesRes = await fetch(`${baseUrl}/rooms/${code}/guesses`);
    expect(guessesRes.status).toBe(200);
    const guessesBody = await guessesRes.json();
    expect(Array.isArray(guessesBody.guesses)).toBe(true);
    expect(guessesBody.guesses.length).toBeGreaterThanOrEqual(2);
    const texts = guessesBody.guesses.map((g: any) => g.textTrimmed ?? g.text);
    expect(texts).toContain(secret);

    // verify scoring: participant g2 should have +100
    const roomRes = await fetch(`${baseUrl}/rooms/${code}`);
    const roomBody = await roomRes.json();
    const updated = roomBody.room;
    const player2 = updated.participants.find(
      (p: any) => p.id === g2.participantId
    );
    expect((player2 as any).score).toBeDefined();
    expect((player2 as any).score).toBeGreaterThanOrEqual(100);

    // drawer posts a canvas event and should see it in their snapshot
    const canvasPost = await fetch(`${baseUrl}/rooms/${code}/canvas-events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: hostId,
        event: { type: "draw", payload: { x: 1, y: 2 } }
      })
    });
    expect(canvasPost.status).toBe(201);

    const drawerAfter = await fetch(
      `${baseUrl}/rooms/${code}?participantId=${hostId}`
    );
    const drawerAfterBody = await drawerAfter.json();
    expect(Array.isArray(drawerAfterBody.room.canvasEvents)).toBe(true);
    expect(drawerAfterBody.room.canvasEvents.length).toBeGreaterThanOrEqual(1);
  });
});
