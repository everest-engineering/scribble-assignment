import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and host participant", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].isHost).toBe(true);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom adds a new participant to an existing room", () => {
    const host = createRoom("Alice");
    const joinResult = joinRoom(host.room.code, "Bob");

    expect(joinResult).not.toBeNull();
    expect(joinResult?.room.participants).toHaveLength(2);
    expect(joinResult?.room.participants[1].name).toBe("Bob");
    expect(joinResult?.room.participants[1].isHost).toBe(false);
    expect(joinResult?.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("getRoom returns a cloned room object and maintains isolation", () => {
    const firstRoom = createRoom("Alice");
    const clonedRoom = getRoom(firstRoom.room.code);

    expect(clonedRoom).not.toBeNull();
    expect(clonedRoom?.code).toBe(firstRoom.room.code);
    expect(clonedRoom).not.toBe(firstRoom.room);
  });
});
