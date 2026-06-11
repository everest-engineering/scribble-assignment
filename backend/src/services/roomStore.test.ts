import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom, saveRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participantId", () => {
    const result = createRoom("Host");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("toRoomSnapshot includes hostId", () => {
    const result = createRoom("Player");
    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(snapshot.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom adds participant to room", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined!.room.participants).toHaveLength(2);
    expect(joined!.room.participants[0].name).toBe("Alice");
    expect(joined!.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom preserves hostId from creator", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined!.room.hostId).toBe(created.participantId);
  });

  it("getRoom returns null for unknown code", () => {
    const room = getRoom("ZZZZ");

    expect(room).toBeNull();
  });

  it("getRoom returns cloned room for existing code", () => {
    const created = createRoom("Alice");
    const room = getRoom(created.room.code);

    expect(room).not.toBeNull();
    expect(room!.code).toBe(created.room.code);
  });

  it("joinRoom returns null when room is in playing status", () => {
    const created = createRoom("Alice");
    const room = getRoom(created.room.code);
    if (room) {
      room.status = "playing";
      saveRoom(room);
    }

    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).toBeNull();
  });

  it("startGame transitions room to playing status", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result).not.toBeNull();
    expect(result!.room.status).toBe("playing");
  });

  it("startGame rejects non-host participantId", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const nonHostId = "some-random-uuid";
    const result = startGame(created.room.code, nonHostId);

    expect(result).toBeNull();
  });

  it("startGame rejects when fewer than 2 participants", () => {
    const created = createRoom("Alice");
    const result = startGame(created.room.code, created.participantId);

    expect(result).toBeNull();
  });

  it("startGame returns null for unknown room code", () => {
    const result = startGame("ZZZZ", "some-id");

    expect(result).toBeNull();
  });
});
