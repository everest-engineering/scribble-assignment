import { describe, expect, it } from "vitest";
import { createRoom, joinRoom } from "./roomStore.js";

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

  it("createRoom assigns hostId, trims name, and sets initial score to 0", () => {
    const result = createRoom("  Alice  ");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.scores[result.participantId]).toBe(0);
  });

  it("joinRoom adds player, trims name, sets score to 0, and keeps hostId", () => {
    const creatorResult = createRoom("Alice");
    const code = creatorResult.room.code;

    const joinResult = joinRoom(code, "  Bob  ");
    expect(joinResult).not.toBeNull();
    if (joinResult) {
      expect(joinResult.room.participants).toHaveLength(2);
      expect(joinResult.room.participants[1].name).toBe("Bob");
      expect(joinResult.room.scores[joinResult.participantId]).toBe(0);
      expect(joinResult.room.hostId).toBe(creatorResult.participantId);
    }
  });
});
