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
  // Node's address() can be string or object; cast to any
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const addr = server.address();
  if (addr && typeof addr === "object")
    return `http://127.0.0.1:${(addr as any).port}`;
  return `http://127.0.0.1`;
}

describe("rooms API contracts", () => {
  let server: any;
  let baseUrl: string;

  beforeEach(async () => {
    const app = createApp();
    // start server
    // @ts-ignore
    server = await listen(app);
    baseUrl = await addressOf(server);
  });

  afterEach(async () => {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  });

  it("POST /api/rooms creates a room and assigns host", async () => {
    const res = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Alice" })
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.participantId).toBeDefined();
    expect(body.room).toBeDefined();
    expect(body.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(body.room.hostId).toBe(body.participantId);
  });

  it("POST /api/rooms/:code/join returns 404 for invalid code and adds participant for valid code", async () => {
    // invalid
    const bad = await fetch(`${baseUrl}/rooms/ZZZZ/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Bob" })
    });
    expect(bad.status).toBe(404);

    // create a room then join
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Host" })
    });
    const created = await createRes.json();
    const code = created.room.code;

    const joinRes = await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Guest" })
    });

    expect(joinRes.status).toBe(200);
    const joinBody = await joinRes.json();
    expect(joinBody.participantId).toBeDefined();
    expect(
      joinBody.room.participants.some(
        (p: any) => p.id === joinBody.participantId
      )
    ).toBe(true);
  });

  it("GET /api/rooms/:code returns room snapshot", async () => {
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Host2" })
    });
    const created = await createRes.json();
    const code = created.room.code;

    const getRes = await fetch(`${baseUrl}/rooms/${code}`);
    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.room).toBeDefined();
    expect(body.room.code).toBe(code);
    expect(Array.isArray(body.room.participants)).toBe(true);
  });

  it("rejects whitespace-only player names on create/join", async () => {
    const res = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "   " })
    });

    expect(res.status).toBe(400);
  });

  it("only drawer sees secret word in room snapshot", async () => {
    // create and join
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Host3" })
    });
    const created = await createRes.json();
    const code = created.room.code;

    const joinRes = await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Guest2" })
    });
    const joined = await joinRes.json();

    // start game as host
    const startRes = await fetch(`${baseUrl}/rooms/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });
    expect(startRes.status).toBe(200);

    // guest snapshot should not include secretWord
    const guestGet = await fetch(
      `${baseUrl}/rooms/${code}?participantId=${joined.participantId}`
    );
    const guestBody = await guestGet.json();
    expect(guestBody.room.secretWord).toBeUndefined();

    // drawer snapshot should include secretWord
    const drawerGet = await fetch(
      `${baseUrl}/rooms/${code}?participantId=${created.participantId}`
    );
    const drawerBody = await drawerGet.json();
    expect(drawerBody.room.secretWord).toBeDefined();

    // drawer can fetch secret-word endpoint
    const secretRes = await fetch(
      `${baseUrl}/rooms/${code}/secret-word?participantId=${created.participantId}`
    );
    expect(secretRes.status).toBe(200);
    const secretBody = await secretRes.json();
    expect(secretBody.secretWord).toBeDefined();

    // non-drawer cannot fetch secret-word
    const guestSecret = await fetch(
      `${baseUrl}/rooms/${code}/secret-word?participantId=${joined.participantId}`
    );
    expect(guestSecret.status).toBe(403);
  });
});
