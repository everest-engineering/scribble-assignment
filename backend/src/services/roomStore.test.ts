import { beforeEach, describe, expect, it } from "vitest";
import { createRoom, joinRoom, resetRoomsForTest, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    resetRoomsForTest();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("rejects empty player names", () => {
    expect(() => createRoom("   ")).toThrow("Player name is required");
  });

  it("keeps rooms isolated", () => {
    const first = createRoom("Alice");
    const second = createRoom("Bob");

    joinRoom(first.room.code, "Carol");

    expect(toRoomSnapshot(first.room, first.participantId).participants).toHaveLength(1);
    expect(toRoomSnapshot(second.room, second.participantId).participants).toHaveLength(1);
  });

  it("starts only when host has at least two players", () => {
    const room = createRoom("Alice");

    expect(() => startGame(room.room.code, room.participantId)).toThrow("At least 2 players are required to start");

    const joined = joinRoom(room.room.code, "Bob");
    if (!joined) {
      throw new Error("Expected Bob to join");
    }

    expect(() => startGame(room.room.code, joined.participantId)).toThrow("Only the host can perform this action");

    const started = startGame(room.room.code, room.participantId);

    expect(started.room.status).toBe("active");
    expect(started.room.round?.drawerParticipantId).toBe(room.participantId);
  });

  it("hides the secret word from non-drawers after start", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    if (!guest) {
      throw new Error("Expected Bob to join");
    }
    const started = startGame(host.room.code, host.participantId);

    expect(toRoomSnapshot(started.room, host.participantId).secretWord).toBe("rocket");
    expect(toRoomSnapshot(started.room, guest.participantId).secretWord).toBeUndefined();
  });
});
