import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, removeParticipant, getRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and assigns host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].role).toBeNull();
    expect(result.participantId).toBeDefined();
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");
    expect(result.room.secretWord).toBeNull();
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

  it("startGame assigns drawer role to host and guesser to others", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(initialRoom.code, "Bob")!;
    const guestId = joinResult.participantId;

    const startedRoom = startGame(initialRoom.code, hostId)!;

    expect(startedRoom.status).toBe("playing");
    expect(startedRoom.secretWord).toBe("rocket");
    
    const host = startedRoom.participants.find(p => p.id === hostId)!;
    const guest = startedRoom.participants.find(p => p.id === guestId)!;

    expect(host.role).toBe("drawer");
    expect(guest.role).toBe("guesser");
  });

  it("toRoomSnapshot conditionally masks the secretWord based on the viewer's role", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(initialRoom.code, "Bob")!;
    const guestId = joinResult.participantId;

    const startedRoom = startGame(initialRoom.code, hostId)!;

    const hostSnapshot = toRoomSnapshot(startedRoom, hostId);
    expect(hostSnapshot.secretWord).toBe("rocket");

    const guestSnapshot = toRoomSnapshot(startedRoom, guestId);
    expect(guestSnapshot.secretWord).toBeNull();
  });

  it("joinRoom throws an error if the room is already playing", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Alice");
    joinRoom(initialRoom.code, "Bob");
    startGame(initialRoom.code, hostId);

    expect(() => joinRoom(initialRoom.code, "Charlie")).toThrow("Room already in progress");
  });
});
