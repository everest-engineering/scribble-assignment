import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  normalizePlayerName,
  startRoom,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostParticipantId to the creator", () => {
    const result = createRoom("Alice");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("normalizePlayerName trims surrounding whitespace", () => {
    expect(normalizePlayerName("  Alex  ")).toEqual({ ok: true, name: "Alex" });
  });

  it("normalizePlayerName rejects empty and whitespace-only names", () => {
    expect(normalizePlayerName("")).toEqual({ ok: false, reason: "empty_name" });
    expect(normalizePlayerName("   ")).toEqual({ ok: false, reason: "empty_name" });
  });

  it("createRoom rejects empty names", () => {
    expect(createRoom("   ")).toEqual({ ok: false, reason: "empty_name" });
  });

  it("createRoom stores trimmed names", () => {
    const result = createRoom("  Sam  ");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.participants[0].name).toBe("Sam");
  });

  it("joinRoom returns not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("joinRoom rejects empty names", () => {
    const host = createRoom("Host");

    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    expect(joinRoom(host.room.code, "   ")).toEqual({ ok: false, reason: "empty_name" });
  });

  it("startRoom rejects non-host participant", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

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
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    const result = startRoom(host.room.code, host.participantId);

    expect(result).toEqual({ ok: false, reason: "not_enough_players" });
  });

  it("startRoom succeeds for host with two players", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    joinRoom(host.room.code, "Guest");

    const result = startRoom(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.status).toBe("playing");
    }
  });

  it("startRoom sets drawerParticipantId to host and secretWord to rocket", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    joinRoom(host.room.code, "Guest");

    const result = startRoom(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.drawerParticipantId).toBe(host.participantId);
      expect(result.room.secretWord).toBe("rocket");
    }
  });

  it("toRoomSnapshot includes secretWord only for drawer viewer", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    const guest = joinRoom(host.room.code, "Guest");
    expect(guest.ok).toBe(true);
    if (!guest.ok) {
      return;
    }

    const started = startRoom(host.room.code, host.participantId);
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(started.room, guest.participantId);

    expect(drawerSnapshot.secretWord).toBe("rocket");
    expect(guesserSnapshot.secretWord).toBeUndefined();
    expect(drawerSnapshot.participants.find((p) => p.id === host.participantId)?.role).toBe(
      "drawer"
    );
    expect(guesserSnapshot.participants.find((p) => p.id === guest.participantId)?.role).toBe(
      "guesser"
    );
  });
});
