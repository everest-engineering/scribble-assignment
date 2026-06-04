import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame } from "./roomStore.js";

describe("roomStore", () => {

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame succeeds when host calls with at least 2 players", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result.room.status).toBe("playing");
  });

  it("startGame throws for non-host participant", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob");

    expect(() => startGame(created.room.code, joiner!.participantId)).toThrow(
      "Only the host can start the game"
    );
  });

  it("startGame throws when fewer than 2 players", () => {
    const created = createRoom("Alice");

    expect(() => startGame(created.room.code, created.participantId)).toThrow(
      "At least 2 players are required to start"
    );
  });

  it("startGame throws for unknown room", () => {
    expect(() => startGame("ZZZZ", "some-id")).toThrow("Room not found");
  });

  it("getRoom includes hostId in snapshot", () => {
    const created = createRoom("Alice");
    const room = getRoom(created.room.code);

    expect(room).not.toBeNull();
    expect(room!.hostId).toBe(created.participantId);
  });
});
