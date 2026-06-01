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

describe("restart: per-round secrets cleared after restart", () => {
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

  it("clears secret word after POST /rooms/:code/restart by host", async () => {
    // create host
    const createRes = await fetch(`${baseUrl}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Host" })
    });
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const code = created.room.code;

    // join a second player so the game can start
    const joinRes = await fetch(`${baseUrl}/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName: "Player2" })
    });
    expect(joinRes.status).toBe(200);
    const joined = await joinRes.json();

    // start the game as host
    const startRes = await fetch(`${baseUrl}/rooms/${code}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });
    expect(startRes.status).toBe(200);

    // drawer should be able to fetch secret-word
    const secretRes = await fetch(
      `${baseUrl}/rooms/${code}/secret-word?participantId=${created.participantId}`
    );
    expect(secretRes.status).toBe(200);
    const secretBody = await secretRes.json();
    expect(secretBody.secretWord).toBeDefined();

    // Now POST restart as host — implementation to be added
    const restartRes = await fetch(`${baseUrl}/rooms/${code}/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: created.participantId })
    });

    // After restart, secret-word must no longer be available to any participant
    expect(restartRes.status).toBe(200);

    const postRestartGet = await fetch(`${baseUrl}/rooms/${code}`);
    expect(postRestartGet.status).toBe(200);
    const postBody = await postRestartGet.json();
    expect(postBody.room.secretWord).toBeUndefined();
    expect(postBody.room.status).toBe("lobby");
  });
});
