import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, getRoom, saveRoom, startGame, toRoomSnapshot } from "./roomStore.js";

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

  it("createRoom trims player names before storing them", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("createRoom rejects whitespace-only player names", () => {
    expect(() => createRoom("   ")).toThrow("Player name is required");
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

  it("joinRoom trims player names before storing them", () => {
    const host = createRoom("Alice");
    const joinResult = joinRoom(host.room.code, "  Bob  ");

    expect(joinResult?.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom rejects whitespace-only player names", () => {
    const host = createRoom("Alice");

    expect(() => joinRoom(host.room.code, "   ")).toThrow("Player name is required");
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

  it("startGame lets the host start the first round as drawer", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.message);
    }
    expect(result.room.status).toBe("inProgress");
    expect(result.room.currentRound?.roundNumber).toBe(1);
    expect(result.room.currentRound?.status).toBe("active");
    expect(result.room.currentRound?.drawerId).toBe(host.participantId);
  });

  it("startGame falls back to the first participant when the host is missing", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const room = getRoom(host.room.code);

    if (!room) {
      throw new Error("Expected room");
    }

    const firstParticipantId = room.participants[0].id;
    const savedRoom = saveRoom({
      ...room,
      hostId: "missing-host"
    });

    if (!savedRoom) {
      throw new Error("Expected saved room");
    }

    const result = startGame(savedRoom.code, firstParticipantId);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.message);
    }
    expect(result.room.currentRound?.drawerId).toBe(firstParticipantId);
  });

  it("startGame rejects non-host participants", () => {
    const host = createRoom("Alice");
    const bob = joinRoom(host.room.code, "Bob");

    if (!bob) {
      throw new Error("Expected Bob to join");
    }

    const result = startGame(host.room.code, bob.participantId);

    expect(result).toEqual({
      ok: false,
      statusCode: 403,
      message: "Only the host can start the game"
    });
  });

  it("startGame rejects rooms with fewer than two players", () => {
    const host = createRoom("Alice");

    const result = startGame(host.room.code, host.participantId);

    expect(result).toEqual({
      ok: false,
      statusCode: 409,
      message: "At least 2 players are required to start the game"
    });
  });

  it("startGame rejects rooms that have already started", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const result = startGame(host.room.code, host.participantId);

    expect(result).toEqual({
      ok: false,
      statusCode: 409,
      message: "Game has already started"
    });
  });

  it("toRoomSnapshot exposes the active drawer name to all viewers", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const result = startGame(host.room.code, host.participantId);

    if (!result.ok) {
      throw new Error(result.message);
    }

    const snapshot = toRoomSnapshot(result.room, "unknown-viewer");

    expect(snapshot.currentRound?.drawerName).toBe("Alice");
  });

  it("toRoomSnapshot includes rocket only for the drawer", () => {
    const host = createRoom("Alice");
    const bob = joinRoom(host.room.code, "Bob");

    if (!bob) {
      throw new Error("Expected Bob to join");
    }

    const result = startGame(host.room.code, host.participantId);

    if (!result.ok) {
      throw new Error(result.message);
    }

    const drawerSnapshot = toRoomSnapshot(result.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, bob.participantId);

    expect(drawerSnapshot.currentRound?.secretWord).toBe("rocket");
    expect(guesserSnapshot.currentRound?.secretWord).toBeUndefined();
  });
});
