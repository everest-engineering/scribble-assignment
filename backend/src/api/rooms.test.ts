import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { __resetRoomsForTests } from "../services/roomStore.js";

let server: Server;
let baseUrl: string;

async function startServer() {
  const app = createApp();
  return await new Promise<Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
}

beforeEach(async () => {
  __resetRoomsForTests();
  server = await startServer();
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function postJson(path: string, body: unknown) {
  return await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function createAndJoin() {
  const createRes = await postJson("/rooms", { playerName: "Alice" });
  const created = (await createRes.json()) as {
    participantId: string;
    room: { code: string };
  };
  const joinRes = await postJson(`/rooms/${created.room.code}/join`, { playerName: "Bob" });
  const joined = (await joinRes.json()) as { participantId: string };
  return {
    code: created.room.code,
    hostId: created.participantId,
    guestId: joined.participantId
  };
}

describe("POST /rooms/:code/start", () => {
  it("returns 200 when host requests with >=2 participants", async () => {
    const { code, hostId } = await createAndJoin();
    const res = await postJson(`/rooms/${code}/start`, { participantId: hostId });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      room: { canStart: boolean; viewerIsHost: boolean; status: string };
    };
    expect(body.room.viewerIsHost).toBe(true);
    expect(body.room.status).toBe("round");
    // Once the round has started, there is nothing else to start — canStart turns off.
    expect(body.room.canStart).toBe(false);
  });

  it("returns 403 when a non-host requests", async () => {
    const { code, guestId } = await createAndJoin();
    const res = await postJson(`/rooms/${code}/start`, { participantId: guestId });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Only the host can start the game");
  });

  it("returns 409 when host requests with only one participant", async () => {
    const createRes = await postJson("/rooms", { playerName: "Alice" });
    const created = (await createRes.json()) as { participantId: string; room: { code: string } };
    const res = await postJson(`/rooms/${created.room.code}/start`, {
      participantId: created.participantId
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Need at least 2 players to start");
  });

  it("returns 404 when the room does not exist", async () => {
    const res = await postJson("/rooms/ZZZZ/start", { participantId: "anything" });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Room not found");
  });

  it("returns 400 when the body is missing participantId", async () => {
    const { code } = await createAndJoin();
    const res = await postJson(`/rooms/${code}/start`, {});
    expect(res.status).toBe(400);
  });
});

describe("POST /rooms/:code/join (case-insensitive + 404 message)", () => {
  it("joins regardless of code case and whitespace", async () => {
    const createRes = await postJson("/rooms", { playerName: "Alice" });
    const created = (await createRes.json()) as { room: { code: string } };
    const joinRes = await postJson(`/rooms/${created.room.code.toLowerCase()}/join`, {
      playerName: "Bob"
    });
    expect(joinRes.status).toBe(200);
  });

  it("returns 404 with 'Room not found' for unknown codes", async () => {
    const res = await postJson("/rooms/ZZZZ/join", { playerName: "Bob" });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Room not found");
  });
});

// FR-001, FR-002, FR-003 (US1) + FR-007 (idempotency)
describe("POST /rooms/:code/start — round transition", () => {
  it("transitions the room to status='round' with round 1 and host as drawer", async () => {
    const { code, hostId } = await createAndJoin();
    const res = await postJson(`/rooms/${code}/start`, { participantId: hostId });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      room: {
        status: string;
        hostParticipantId: string;
        participants: Array<{ id: string; isDrawer: boolean }>;
        round: { roundNumber: number; drawerParticipantId: string } | null;
      };
    };
    expect(body.room.status).toBe("round");
    expect(body.room.round).not.toBeNull();
    expect(body.room.round?.roundNumber).toBe(1);
    expect(body.room.round?.drawerParticipantId).toBe(body.room.hostParticipantId);
    expect(body.room.participants.filter((p) => p.isDrawer).map((p) => p.id)).toEqual([
      body.room.hostParticipantId
    ]);
  });

  it("returns the same round payload on a repeat start (idempotent)", async () => {
    const { code, hostId } = await createAndJoin();
    const first = await postJson(`/rooms/${code}/start`, { participantId: hostId });
    const firstBody = await first.json();
    const second = await postJson(`/rooms/${code}/start`, { participantId: hostId });
    const secondBody = await second.json();
    expect(second.status).toBe(200);
    expect(secondBody.room.round).toEqual(firstBody.room.round);
    expect(secondBody.room.status).toBe("round");
  });
});

// FR-005, FR-006 (US2) — visibility leakage guard
describe("GET /rooms/:code — drawer vs guesser word visibility", () => {
  it("returns the cleartext secretWord ONLY to the drawer; guesser response contains no 'secretWord' substring", async () => {
    const { code, hostId, guestId } = await createAndJoin();
    await postJson(`/rooms/${code}/start`, { participantId: hostId });

    const drawerRes = await fetch(`${baseUrl}/rooms/${code}?participantId=${hostId}`);
    const drawerText = await drawerRes.text();
    const guesserRes = await fetch(`${baseUrl}/rooms/${code}?participantId=${guestId}`);
    const guesserText = await guesserRes.text();

    expect(drawerText).toContain('"secretWord":"rocket"');
    expect(guesserText).not.toContain("secretWord");
    expect(guesserText).not.toContain("rocket");

    // Both views still carry the masked word.
    const drawerBody = JSON.parse(drawerText) as { room: { round: { maskedWord: string } } };
    const guesserBody = JSON.parse(guesserText) as { room: { round: { maskedWord: string } } };
    expect(drawerBody.room.round.maskedWord).toBe("______");
    expect(guesserBody.room.round.maskedWord).toBe("______");
  });

  it("returns round=null while still in the lobby for any viewer", async () => {
    const createRes = await postJson("/rooms", { playerName: "Alice" });
    const created = (await createRes.json()) as { participantId: string; room: { code: string } };
    const res = await fetch(
      `${baseUrl}/rooms/${created.room.code}?participantId=${created.participantId}`
    );
    const body = (await res.json()) as { room: { round: unknown; status: string } };
    expect(body.room.round).toBeNull();
    expect(body.room.status).toBe("lobby");
  });
});
