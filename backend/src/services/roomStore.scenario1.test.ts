import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom } from "./roomStore.js";

describe("Scenario 1: Room Setup & Lobby", () => {
  it("host is correctly assigned on room creation", () => {
    const { room, participantId } = createRoom("Host Player");
    expect(room.hostId).toBe(participantId);
    expect(room.participants[0].id).toBe(participantId);
  });

  it("rooms are isolated", () => {
    const room1 = createRoom("Player 1");
    const room2 = createRoom("Player 2");
    
    expect(room1.room.code).not.toBe(room2.room.code);
    expect(getRoom(room1.room.code)?.participants).toHaveLength(1);
    expect(getRoom(room2.room.code)?.participants).toHaveLength(1);
  });

  it("joinRoom adds a participant to the correct room", () => {
    const { room: initialRoom } = createRoom("Host");
    const joinResult = joinRoom(initialRoom.code, "Guest");
    
    expect(joinResult).not.toBeNull();
    const updatedRoom = getRoom(initialRoom.code);
    expect(updatedRoom?.participants).toHaveLength(2);
    expect(updatedRoom?.participants[1].name).toBe("Guest");
    expect(updatedRoom?.hostId).toBe(initialRoom.hostId);
  });
});
