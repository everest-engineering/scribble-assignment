import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, removeParticipant, getRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and assigns host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });
  
  it("removes a participant and transfers host or deletes room", () => {
    const { room: room1, participantId: p1 } = createRoom("Host");
    const joinResult = joinRoom(room1.code, "Guest")!;
    const p2 = joinResult.participantId;
    
    // Test host migration
    removeParticipant(room1.code, p1);
    const updatedRoom = getRoom(room1.code)!;
    expect(updatedRoom.participants).toHaveLength(1);
    expect(updatedRoom.hostId).toBe(p2);
    
    // Test room deletion
    removeParticipant(room1.code, p2);
    expect(getRoom(room1.code)).toBeNull();
  });
});
