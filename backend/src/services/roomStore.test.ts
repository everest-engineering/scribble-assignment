import { describe, expect, it } from "vitest";
import { createRoom, joinRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and host designation", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("two rooms created in sequence have isolated participant lists", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    const idsInA = roomA.room.participants.map((p) => p.id);
    const idsInB = roomB.room.participants.map((p) => p.id);

    expect(idsInA).not.toContain(roomB.participantId);
    expect(idsInB).not.toContain(roomA.participantId);
    expect(roomA.room.hostParticipantId).not.toBe(roomB.room.hostParticipantId);
  });

  it("joinRoom appends a non-host participant and keeps the original host", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined!.participantId).not.toBe(created.participantId);
    expect(joined!.room.hostParticipantId).toBe(created.participantId);
    expect(joined!.room.participants.map((p) => p.id)).toEqual([
      created.participantId,
      joined!.participantId
    ]);
  });

  it("two rooms joined by different players keep their participant lists isolated", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    const aJoiner = joinRoom(roomA.room.code, "Bob");
    const bJoiner = joinRoom(roomB.room.code, "Dave");

    expect(aJoiner).not.toBeNull();
    expect(bJoiner).not.toBeNull();

    const aIds = aJoiner!.room.participants.map((p) => p.id);
    const bIds = bJoiner!.room.participants.map((p) => p.id);

    expect(aIds).not.toContain(bJoiner!.participantId);
    expect(bIds).not.toContain(aJoiner!.participantId);
    expect(aIds).not.toContain(roomB.participantId);
    expect(bIds).not.toContain(roomA.participantId);
  });
});
