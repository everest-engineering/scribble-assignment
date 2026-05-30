import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostParticipantId to the creator", () => {
    const result = createRoom("Alice");

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("startRoom rejects non-host participant", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    expect(guest.ok).toBe(true);
    if (!guest.ok) {
      return;
    }

    const result = startRoom(host.room.code, guest.participantId);

    expect(result).toEqual({ ok: false, reason: "not_host" });
  });

  it("startRoom rejects when fewer than two players", () => {
    const host = createRoom("Host");
    const result = startRoom(host.room.code, host.participantId);

    expect(result).toEqual({ ok: false, reason: "not_enough_players" });
  });

  it("startRoom succeeds for host with two players", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");

    const result = startRoom(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.status).toBe("playing");
    }
  });
});
