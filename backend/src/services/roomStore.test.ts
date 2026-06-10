import { describe, expect, it } from "vitest";
import { createRoom, joinRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and marks the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].isHost).toBe(true);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom adds a participant with isHost set to false", () => {
    const createResult = createRoom("Alice");
    const joinResult = joinRoom(createResult.room.code, "Bob");

    expect(joinResult).not.toBeNull();
    expect(joinResult!.room.participants).toHaveLength(2);
    expect(joinResult!.room.participants[0].name).toBe("Alice");
    expect(joinResult!.room.participants[0].isHost).toBe(true);
    expect(joinResult!.room.participants[1].name).toBe("Bob");
    expect(joinResult!.room.participants[1].isHost).toBe(false);
  });
});
