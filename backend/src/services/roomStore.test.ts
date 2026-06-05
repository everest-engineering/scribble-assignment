import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("makes the creator the host (US1)", () => {
    const { room, participantId } = createRoom("Alice");

    expect(room.hostId).toBe(participantId);
    expect(room.hostId).toBe(room.participants[0].id);
  });

  it("snapshot marks the creator as host and cannot start alone (US1)", () => {
    const { room, participantId } = createRoom("Alice");
    const snapshot = toRoomSnapshot(room, participantId);

    expect(snapshot.isHost).toBe(true);
    expect(snapshot.canStart).toBe(false);
    expect(snapshot.hostId).toBe(participantId);
  });

  it("a joiner is not the host (US2)", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");

    expect(joined).not.toBeNull();
    const snapshot = toRoomSnapshot(joined!.room, joined!.participantId);
    expect(snapshot.isHost).toBe(false);
    expect(snapshot.hostId).toBe(room.hostId);
  });

  it("resolves a room code case-insensitively (US2)", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code.toLowerCase(), "Bob");

    expect(joined).not.toBeNull();
    expect(joined!.room.code).toBe(room.code);
    expect(joined!.room.participants).toHaveLength(2);
  });

  it("keeps two rooms fully isolated (US2)", () => {
    const a = createRoom("Alice");
    joinRoom(a.room.code, "Bob");
    const b = createRoom("Carol");

    expect(a.room.code).not.toBe(b.room.code);
    expect(b.room.participants).toHaveLength(1);
    expect(b.room.participants[0].name).toBe("Carol");
  });

  it("host can only start once two players are present (US5)", () => {
    const { room, participantId } = createRoom("Alice");
    expect(toRoomSnapshot(room, participantId).canStart).toBe(false);

    const joined = joinRoom(room.code, "Bob");
    expect(toRoomSnapshot(joined!.room, participantId).canStart).toBe(true);
  });

  it("a non-host can never start, even with two players (US5)", () => {
    const { room } = createRoom("Alice");
    const joined = joinRoom(room.code, "Bob");

    const snapshot = toRoomSnapshot(joined!.room, joined!.participantId);
    expect(snapshot.isHost).toBe(false);
    expect(snapshot.canStart).toBe(false);
  });
});
