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

  // T009: hostId is set on room creation
  it("createRoom sets hostId to the creator's participantId", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns not_found result for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toMatchObject({ ok: false, reason: "not_found" });
  });

  // T018: max player enforcement
  it("joinRoom returns full error when room already has 4 participants", () => {
    const { room } = createRoom("P1");
    joinRoom(room.code, "P2");
    joinRoom(room.code, "P3");
    joinRoom(room.code, "P4");
    const result = joinRoom(room.code, "P5");

    expect(result).not.toBeNull();
    expect(result).toMatchObject({ ok: false, reason: "full" });
  });

  // T027: startRoom transitions status and guards access
  it("startRoom transitions room status to in-progress when host starts with 2+ players", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");

    const result = startRoom(room.code, participantId);

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.room.status).toBe("in-progress");
    }
  });

  it("startRoom returns not_host when called by a non-host participant", () => {
    const { room } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Guest");

    expect(joinResult).toMatchObject({ ok: true });
    if (!joinResult || !joinResult.ok) return;

    const result = startRoom(room.code, joinResult.participantId);
    expect(result).toMatchObject({ ok: false, reason: "not_host" });
  });

  it("startRoom returns too_few_players when only 1 participant is present", () => {
    const { room, participantId } = createRoom("Host");

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: false, reason: "too_few_players" });
  });

  it("startRoom returns not_found for an unknown room code", () => {
    const result = startRoom("ZZZZ", "any-id");
    expect(result).toMatchObject({ ok: false, reason: "not_found" });
  });
});
