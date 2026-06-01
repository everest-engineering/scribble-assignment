import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom returns error for empty name after trim", () => {
    const room = createRoom("Host");

    const result = joinRoom(room.room.code, "   ");

    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
    expect(result!.room.participants[1].name).toBe("");
  });

  it("startGame fails for non-host", () => {
    const room = createRoom("Host");
    const result = startGame(room.room.code, "some-other-id");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Only the host can start the game");
    }
  });

  it("startGame fails with fewer than 2 players", () => {
    const room = createRoom("Host");
    const result = startGame(room.room.code, room.participantId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("At least 2 players are required");
    }
  });

  it("startGame succeeds with 2 players as host", () => {
    const room = createRoom("Host");
    joinRoom(room.room.code, "Player2");
    const result = startGame(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.status).toBe("drawing");
    }
  });

  it("trims player names on create", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("trims player names on join", () => {
    const room = createRoom("Host");
    const result = joinRoom(room.room.code, "  Bob  ");

    expect(result).not.toBeNull();
    expect(result!.room.participants[1].name).toBe("Bob");
  });
});
