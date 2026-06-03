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

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom throws an error if the room is full", () => {
    const { room: { code } } = createRoom("Host");
    
    // Fill the room (1 host + 11 players = 12)
    for (let i = 1; i < 12; i++) {
      joinRoom(code, `Player${i}`);
    }

    expect(() => joinRoom(code, "TooMany")).toThrow("Room is full");
  });

  it("joinRoom throws an error if the name is already taken", () => {
    const { room: { code } } = createRoom("Alice");

    // Exact match
    expect(() => joinRoom(code, "Alice")).toThrow("Name is already taken");
    
    // Case-insensitive match
    expect(() => joinRoom(code, "aLiCe")).toThrow("Name is already taken");

    // Trimmed match
    expect(() => joinRoom(code, "  Alice  ")).toThrow("Name is already taken");
  });
});
