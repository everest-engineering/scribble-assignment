import http from "node:http";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
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

describe("restart timing", () => {
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

  it("returns room snapshot with cleared round state immediately after restart", async () => {
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "HostTest" })
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const code = created.room.code;

    await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "guest1" })
    });

    await fetch(`${baseUrl}/rooms/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });

    // trigger restart
    const restartRes = await fetch(`${baseUrl}/rooms/${code}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });
    expect(restartRes.status).toBe(200);

    // fetch room snapshot
    const res = await fetch(`${baseUrl}/rooms/${code}`);
    expect(res.status).toBe(200);
    const snapshotBody = await res.json();
    const snapshot = snapshotBody.room;
    expect(snapshot.status).toBe("lobby");
    expect(snapshot.secretWord).toBeUndefined();
  });
});
