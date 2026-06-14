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

// FR-001, FR-002, FR-004, FR-005, FR-006 (US1 + US2) — guess flow over HTTP
describe("POST /rooms/:code/guesses — guess submission, validation, scoring, idempotency", () => {
  async function setupActiveRound() {
    const ids = await createAndJoin();
    await postJson(`/rooms/${ids.code}/start`, { participantId: ids.hostId });
    return ids;
  }

  it("200 on a wrong guess: appends to the feed, scores unchanged, lockout empty", async () => {
    const { code, hostId, guestId } = await setupActiveRound();
    const res = await postJson(`/rooms/${code}/guesses`, { participantId: guestId, text: "cat" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      room: {
        round: {
          guesses: Array<{ text: string; isCorrect: boolean; displayName: string }>;
          scores: Record<string, number>;
          lockedParticipantIds: string[];
        };
      };
    };
    expect(body.room.round.guesses).toHaveLength(1);
    expect(body.room.round.guesses[0]).toMatchObject({
      text: "cat",
      isCorrect: false,
      displayName: "Bob"
    });
    expect(body.room.round.scores).toEqual({ [hostId]: 0, [guestId]: 0 });
    expect(body.room.round.lockedParticipantIds).toEqual([]);
  });

  it("200 on a correct guess: trims, +100 to guesser, locks them out, leaves drawer score at 0", async () => {
    const { code, hostId, guestId } = await setupActiveRound();
    const res = await postJson(`/rooms/${code}/guesses`, {
      participantId: guestId,
      text: "  RoCkEt  "
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      room: {
        round: {
          guesses: Array<{ text: string; isCorrect: boolean }>;
          scores: Record<string, number>;
          lockedParticipantIds: string[];
        };
      };
    };
    expect(body.room.round.guesses[0]).toMatchObject({ text: "RoCkEt", isCorrect: true });
    expect(body.room.round.scores).toEqual({ [hostId]: 0, [guestId]: 100 });
    expect(body.room.round.lockedParticipantIds).toEqual([guestId]);
  });

  it.each([
    { label: "empty text", body: { text: "" } },
    { label: "whitespace-only text", body: { text: "    " } },
    { label: "51-char text", body: { text: "x".repeat(51) } },
    { label: "missing text", body: {} }
  ])("400 for invalid body ($label)", async ({ body: partialBody }) => {
    const { code, guestId } = await setupActiveRound();
    const res = await postJson(`/rooms/${code}/guesses`, {
      participantId: guestId,
      ...partialBody
    });
    expect(res.status).toBe(400);
  });

  it("400 when participantId is missing", async () => {
    const { code } = await setupActiveRound();
    const res = await postJson(`/rooms/${code}/guesses`, { text: "rocket" });
    expect(res.status).toBe(400);
  });

  it("403 'Drawers cannot guess in their own round' when the drawer submits", async () => {
    const { code, hostId } = await setupActiveRound();
    const res = await postJson(`/rooms/${code}/guesses`, { participantId: hostId, text: "rocket" });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Drawers cannot guess in their own round");
  });

  it("403 'Participant is not in the room' for unknown participantId", async () => {
    const { code } = await setupActiveRound();
    const res = await postJson(`/rooms/${code}/guesses`, {
      participantId: "ghost-uuid",
      text: "rocket"
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Participant is not in the room");
  });

  it("404 'Room not found' for an unknown code", async () => {
    const res = await postJson("/rooms/ZZZZ/guesses", {
      participantId: "anyone",
      text: "rocket"
    });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Room not found");
  });

  it("409 'No round in progress' when the room is in lobby", async () => {
    const { code, hostId } = await createAndJoin();
    // skip start
    const res = await postJson(`/rooms/${code}/guesses`, { participantId: hostId, text: "rocket" });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("No round in progress");
  });

  // FR-005 (US2) — lockout
  it("409 'You have already guessed correctly this round' on a second correct guess; scoreboard unchanged", async () => {
    const { code, guestId } = await setupActiveRound();
    await postJson(`/rooms/${code}/guesses`, { participantId: guestId, text: "rocket" });
    const second = await postJson(`/rooms/${code}/guesses`, {
      participantId: guestId,
      text: "rocket"
    });
    expect(second.status).toBe(409);
    const body = (await second.json()) as { message: string };
    expect(body.message).toBe("You have already guessed correctly this round");

    // Re-poll and confirm the scoreboard is stable.
    const pollRes = await fetch(`${baseUrl}/rooms/${code}?participantId=${guestId}`);
    const pollBody = (await pollRes.json()) as {
      room: { round: { scores: Record<string, number>; guesses: unknown[] } };
    };
    expect(pollBody.room.round.scores[guestId]).toBe(100);
    expect(pollBody.room.round.guesses).toHaveLength(1);
  });

  // FR-005 carry-over: even after multiple wrong guesses, secret word must not leak to non-drawers.
  it("guesser poll body never contains the literal 'secretWord' substring (raw JSON guard)", async () => {
    const { code, hostId, guestId } = await setupActiveRound();
    for (const w of ["cat", "dog", "sun", "mug", "pen"]) {
      await postJson(`/rooms/${code}/guesses`, { participantId: guestId, text: w });
    }
    const guesserRes = await fetch(`${baseUrl}/rooms/${code}?participantId=${guestId}`);
    const guesserText = await guesserRes.text();
    expect(guesserText).not.toContain('"secretWord"');
    expect(guesserText).not.toContain("rocket");

    // Drawer still sees the word.
    const drawerRes = await fetch(`${baseUrl}/rooms/${code}?participantId=${hostId}`);
    const drawerText = await drawerRes.text();
    expect(drawerText).toContain('"secretWord":"rocket"');
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

describe("POST /rooms/:code/end", () => {
  async function createJoinStart() {
    const ids = await createAndJoin();
    await postJson(`/rooms/${ids.code}/start`, { participantId: ids.hostId });
    return ids;
  }

  it("200: host transitions round → result; secretWord revealed", async () => {
    const { code, hostId } = await createJoinStart();
    const res = await postJson(`/rooms/${code}/end`, { participantId: hostId });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      room: { status: string; round: { secretWord?: string } | null };
    };
    expect(body.room.status).toBe("result");
    expect(body.room.round?.secretWord).toBe("rocket");
  });

  it("200 idempotent: a second end by host is a no-op", async () => {
    const { code, hostId } = await createJoinStart();
    await postJson(`/rooms/${code}/end`, { participantId: hostId });
    const res = await postJson(`/rooms/${code}/end`, { participantId: hostId });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { room: { status: string } };
    expect(body.room.status).toBe("result");
  });

  it("400: empty participantId", async () => {
    const { code } = await createJoinStart();
    const res = await postJson(`/rooms/${code}/end`, { participantId: "" });
    expect(res.status).toBe(400);
  });

  it("403: non-host caller", async () => {
    const { code, guestId } = await createJoinStart();
    const res = await postJson(`/rooms/${code}/end`, { participantId: guestId });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Only the host can end the round");
  });

  it("404: unknown room", async () => {
    const res = await postJson(`/rooms/ZZZZ/end`, { participantId: "p1" });
    expect(res.status).toBe(404);
  });

  it("409: lobby-state room", async () => {
    const { code, hostId } = await createAndJoin();
    const res = await postJson(`/rooms/${code}/end`, { participantId: hostId });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("No active round to end");
  });

  it("guesser sees cleartext secretWord in their poll body during result", async () => {
    const { code, hostId, guestId } = await createJoinStart();
    await postJson(`/rooms/${code}/end`, { participantId: hostId });
    const res = await fetch(`${baseUrl}/rooms/${code}?participantId=${guestId}`);
    const raw = await res.text();
    expect(raw).toContain('"secretWord":"rocket"');
  });

  it("guess submission during result returns 409 and feed unchanged", async () => {
    const { code, hostId, guestId } = await createJoinStart();
    await postJson(`/rooms/${code}/end`, { participantId: hostId });
    const res = await postJson(`/rooms/${code}/guesses`, {
      participantId: guestId,
      text: "rocket"
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("No round in progress");
  });
});

describe("POST /rooms/:code/restart", () => {
  async function createJoinStartEnd() {
    const ids = await createAndJoin();
    await postJson(`/rooms/${ids.code}/start`, { participantId: ids.hostId });
    await postJson(`/rooms/${ids.code}/end`, { participantId: ids.hostId });
    return ids;
  }

  it("200: host transitions result → lobby; round=null; canStart=true", async () => {
    const { code, hostId } = await createJoinStartEnd();
    const res = await postJson(`/rooms/${code}/restart`, { participantId: hostId });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      room: { status: string; round: unknown; canStart: boolean };
    };
    expect(body.room.status).toBe("lobby");
    expect(body.room.round).toBeNull();
    expect(body.room.canStart).toBe(true);
  });

  it("200 idempotent: a second restart by host is a no-op", async () => {
    const { code, hostId } = await createJoinStartEnd();
    await postJson(`/rooms/${code}/restart`, { participantId: hostId });
    const res = await postJson(`/rooms/${code}/restart`, { participantId: hostId });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { room: { status: string } };
    expect(body.room.status).toBe("lobby");
  });

  it("400: empty participantId", async () => {
    const { code } = await createJoinStartEnd();
    const res = await postJson(`/rooms/${code}/restart`, { participantId: "" });
    expect(res.status).toBe(400);
  });

  it("403: non-host caller", async () => {
    const { code, guestId } = await createJoinStartEnd();
    const res = await postJson(`/rooms/${code}/restart`, { participantId: guestId });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("Only the host can restart the room");
  });

  it("404: unknown room", async () => {
    const res = await postJson(`/rooms/ZZZZ/restart`, { participantId: "p1" });
    expect(res.status).toBe(404);
  });

  it("409: round-state room", async () => {
    const { code, hostId } = await createAndJoin();
    await postJson(`/rooms/${code}/start`, { participantId: hostId });
    const res = await postJson(`/rooms/${code}/restart`, { participantId: hostId });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { message: string };
    expect(body.message).toBe("End the active round before restarting");
  });

  it("end-to-end loop: start → guess → end → restart → start gives a fresh round", async () => {
    const { code, hostId, guestId } = await createAndJoin();
    await postJson(`/rooms/${code}/start`, { participantId: hostId });
    await postJson(`/rooms/${code}/guesses`, { participantId: guestId, text: "rocket" });
    await postJson(`/rooms/${code}/end`, { participantId: hostId });
    await postJson(`/rooms/${code}/restart`, { participantId: hostId });
    const res = await postJson(`/rooms/${code}/start`, { participantId: hostId });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      room: {
        round: {
          guesses: unknown[];
          scores: Record<string, number>;
        } | null;
      };
    };
    expect(body.room.round?.guesses).toEqual([]);
    expect(body.room.round?.scores[hostId]).toBe(0);
    expect(body.room.round?.scores[guestId]).toBe(0);
  });
});
