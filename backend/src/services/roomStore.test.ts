import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom, saveRoom, startGame, toRoomSnapshot } from "./roomStore.js";
import { HttpError } from "../api/schemas.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and host assignment", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].score).toBe(0);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("createRoom rejects empty or whitespace-only name", () => {
    expect(() => createRoom("   ")).toThrow(HttpError);
    expect(() => createRoom("")).toThrow(HttpError);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom rejects empty or whitespace-only name", () => {
    const { room } = createRoom("Alice");
    expect(() => joinRoom(room.code, "   ")).toThrow(HttpError);
  });

  it("joinRoom trims names and rejects duplicates (case-insensitive)", () => {
    const { room } = createRoom("Alice");
    
    // Test trimming
    const joinResult = joinRoom(room.code, "  Bob  ");
    expect(joinResult).not.toBeNull();
    const updatedRoom = getRoom(room.code);
    expect(updatedRoom?.participants[1].name).toBe("Bob");

    // Test duplicate name
    expect(() => joinRoom(room.code, "alice")).toThrow(HttpError);
    expect(() => joinRoom(room.code, "Bob")).toThrow(HttpError);
  });

  it("joinRoom rejects joining when room is not in lobby status", () => {
    const { room } = createRoom("Alice");
    
    const fetchedRoom = getRoom(room.code);
    if (fetchedRoom) {
      fetchedRoom.status = "game";
      saveRoom(fetchedRoom);
    }

    expect(() => joinRoom(room.code, "Bob")).toThrow(HttpError);
  });

  it("startGame transitions room status to game, sets host as drawer, and selects secret word", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const joinResult = joinRoom(room.code, "Bob");
    expect(joinResult).not.toBeNull();
    const guestId = joinResult!.participantId;

    const activeRoom = startGame(room.code, hostId);
    expect(activeRoom.status).toBe("game");
    expect(activeRoom.drawerId).toBe(hostId);
    expect(activeRoom.secretWord).toBe("rocket");

    // Verify snapshot visibility
    const hostSnapshot = toRoomSnapshot(activeRoom, hostId);
    expect(hostSnapshot.secretWord).toBe("rocket");

    const guestSnapshot = toRoomSnapshot(activeRoom, guestId);
    expect(guestSnapshot.secretWord).toBeNull();
  });

  it("startGame rejects request if not host or not enough players", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    
    expect(() => startGame(room.code, hostId)).toThrow(HttpError);

    const joinResult = joinRoom(room.code, "Bob");
    const guestId = joinResult!.participantId;

    expect(() => startGame(room.code, guestId)).toThrow(HttpError);
  });
});
