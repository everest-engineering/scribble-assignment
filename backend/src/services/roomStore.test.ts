import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].isHost).toBe(true);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom adds a non-host participant", () => {
    const created = createRoom("Alice");
    const result = joinRoom(created.room.code, "Bob");

    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
    expect(result!.room.participants[0].isHost).toBe(true);
    expect(result!.room.participants[1].isHost).toBe(false);
  });

  it("rooms are fully isolated — joining one room does not affect another", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Charlie");

    joinRoom(roomA.room.code, "Bob");

    const snapshotA = joinRoom(roomA.room.code, "Dave");
    const snapshotB = getRoom(roomB.room.code);

    expect(snapshotA!.room.participants).toHaveLength(3);
    expect(snapshotB!.participants).toHaveLength(1);
    expect(snapshotB!.participants[0].name).toBe("Charlie");
  });

  it("room isolation — participants from one room are never visible in another", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Bob");

    joinRoom(roomA.room.code, "Charlie");
    joinRoom(roomA.room.code, "Dave");

    const snapshotB = getRoom(roomB.room.code);

    expect(snapshotB!.participants).toHaveLength(1);
    expect(snapshotB!.participants[0].name).toBe("Bob");
    for (const participant of snapshotB!.participants) {
      expect(participant.name).not.toBe("Charlie");
      expect(participant.name).not.toBe("Dave");
    }
  });
});
