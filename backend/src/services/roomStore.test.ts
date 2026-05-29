import { describe, expect, it } from "vitest";
import { createRoom, joinRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 6-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom throws error for an unknown room code", () => {
    expect(() => joinRoom("ZZZZZZ", "Bob")).toThrow("Room not found");
  });

  it("joinRoom throws error for duplicate usernames", () => {
    const { room } = createRoom("Alice");
    expect(() => joinRoom(room.code, "Alice")).toThrow("Username already taken in this room");
  });

  it("joinRoom enforces max 20 players", () => {
    const { room } = createRoom("Player0");
    for (let i = 1; i < 20; i++) {
        joinRoom(room.code, `Player${i}`);
    }
    expect(() => joinRoom(room.code, "Player20")).toThrow("Room is full");
  });
});
