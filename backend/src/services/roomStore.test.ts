import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom, toRoomSnapshot, saveRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code from allowed alphabet", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z2-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("assigns hostParticipantId on create and preserves it on join", () => {
    const { room, participantId } = createRoom("HostUser");

    // initial host should be the creator
    const snapshot1 = toRoomSnapshot(room, participantId);
    expect(snapshot1.hostParticipantId).toBe(participantId);
    expect(snapshot1.viewerIsHost).toBe(true);

    // join another player
    const joinResult = joinRoom(room.code, "SecondUser");
    expect(joinResult).not.toBeNull();
    const secondParticipantId = joinResult!.participantId;

    const updatedRoom = getRoom(room.code)!;
    const snapshot2 = toRoomSnapshot(updatedRoom, secondParticipantId);
    expect(snapshot2.hostParticipantId).toBe(participantId);
    expect(snapshot2.viewerIsHost).toBe(false);
  });

  it("promotes earliest joined participant to host if current host is missing", () => {
    const { room, participantId: hostId } = createRoom("HostUser");
    const joinResult = joinRoom(room.code, "SecondUser");
    const secondUserId = joinResult!.participantId;
    
    // Simulate host leaving by removing them from participants and saving
    const currentRoom = getRoom(room.code)!;
    currentRoom.participants = currentRoom.participants.filter(p => p.id !== hostId);
    saveRoom(currentRoom);
    
    // Calling getRoom should now promote the second user
    const updatedRoom = getRoom(room.code)!;
    expect((updatedRoom as any).hostParticipantId).toBe(secondUserId);
  });

  it("isolates rooms so participants from one do not appear in another", () => {
    const room1 = createRoom("Alice1");
    const room2 = createRoom("Bob2");

    joinRoom(room1.room.code, "Charlie1");
    joinRoom(room2.room.code, "Dave2");

    const state1 = getRoom(room1.room.code)!;
    const state2 = getRoom(room2.room.code)!;

    expect(state1.participants.map(p => p.name)).toEqual(["Alice1", "Charlie1"]);
    expect(state2.participants.map(p => p.name)).toEqual(["Bob2", "Dave2"]);
  });
});


