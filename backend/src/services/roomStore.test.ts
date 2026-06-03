import { describe, expect, it } from "vitest";
import { HttpError } from "../api/schemas.js";
import { createRoom, getRoom, joinRoom, startRound } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and a host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].score).toBe(0);
    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom throws a 404 for an unknown room code", () => {
    expect(() => joinRoom("ZZZZ", "Bob")).toThrowError(HttpError);
  });

  it("keeps rooms fully isolated", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    joinRoom(roomA.room.code, "Bob");

    expect(getRoom(roomA.room.code).participants).toHaveLength(2);
    expect(getRoom(roomB.room.code).participants).toHaveLength(1);
  });

  it("startRound rejects non-hosts, single players, and double starts", () => {
    const host = createRoom("Alice");

    expect(() => startRound(host.room.code, "not-the-host")).toThrowError(/host/i);
    expect(() => startRound(host.room.code, host.participantId)).toThrowError(/2 players/i);

    joinRoom(host.room.code, "Bob");
    const started = startRound(host.room.code, host.participantId);
    expect(started.status).toBe("playing");

    expect(() => startRound(host.room.code, host.participantId)).toThrowError(/already started/i);
  });
});
