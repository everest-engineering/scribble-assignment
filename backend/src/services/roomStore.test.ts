import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRoom, toRoomSnapshot } from "./roomStore.js";

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

  // T004: drawer assignment
  it("startRoom sets drawerId to hostId on success", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.room.drawerId).toBe(participantId);
    }
  });

  it("startRoom sets currentWord to 'rocket' on success", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.room.currentWord).toBe("rocket");
    }
  });

  it("startRoom returns already_started when room is already in-progress", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    startRoom(room.code, participantId);

    const result = startRoom(room.code, participantId);
    expect(result).toMatchObject({ ok: false, reason: "already_started" });
  });

  it("createRoom initializes drawerId and currentWord to null", () => {
    const { room } = createRoom("Alice");
    expect(room.drawerId).toBeNull();
    expect(room.currentWord).toBeNull();
  });

  // T004: toRoomSnapshot viewer-based word filtering
  it("toRoomSnapshot returns currentWord for the drawer", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    if (!result.ok) throw new Error("expected ok");

    const snapshot = toRoomSnapshot(result.room, participantId);
    expect(snapshot.drawerId).toBe(participantId);
    expect(snapshot.currentWord).toBe("rocket");
  });

  it("toRoomSnapshot returns null currentWord for non-drawer", () => {
    const { room, participantId } = createRoom("Host");
    const joinResult = joinRoom(room.code, "Guest");
    if (!joinResult || !joinResult.ok) throw new Error("expected join ok");
    const result = startRoom(room.code, participantId);
    if (!result.ok) throw new Error("expected ok");

    const snapshot = toRoomSnapshot(result.room, joinResult.participantId);
    expect(snapshot.drawerId).toBe(participantId);
    expect(snapshot.currentWord).toBeNull();
  });

  it("toRoomSnapshot returns null currentWord when no viewerParticipantId provided", () => {
    const { room, participantId } = createRoom("Host");
    joinRoom(room.code, "Guest");
    const result = startRoom(room.code, participantId);
    if (!result.ok) throw new Error("expected ok");

    const snapshot = toRoomSnapshot(result.room);
    expect(snapshot.drawerId).toBe(participantId);
    expect(snapshot.currentWord).toBeNull();
  });

  // T012: name trimming and empty-name rejection
  it("createRoom stores trimmed name when name has leading/trailing whitespace", () => {
    const { room } = createRoom("  Alice  ");
    expect(room.participants[0].name).toBe("Alice");
  });

  it("createRoom returns an error for empty name", () => {
    const result = createRoom("   ");
    expect(result).toMatchObject({ ok: false, reason: "invalid_name" });
  });

  it("joinRoom stores trimmed name when name has leading/trailing whitespace", () => {
    const { room } = createRoom("Host");
    const result = joinRoom(room.code, "  Bob  ");
    expect(result).not.toBeNull();
    if (!result || !result.ok) throw new Error("expected ok");
    expect(result.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom returns an error for empty name", () => {
    const { room } = createRoom("Host");
    const result = joinRoom(room.code, "   ");
    expect(result).toMatchObject({ ok: false, reason: "invalid_name" });
  });
});
