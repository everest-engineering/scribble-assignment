import { beforeEach, describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, resetRoomsForTests, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    resetRoomsForTests();
  });
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);

    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(snapshot.isHost).toBe(true);
    expect(snapshot.canStart).toBe(false);
    expect(snapshot.participants[0].isHost).toBe(true);
  });

  it("joinRoom returns not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ error: "not_found" });
  });

  it("joinRoom adds a participant to an existing lobby", () => {
    const host = createRoom("Alice");
    const result = joinRoom(host.room.code, "Bob");

    expect("error" in result).toBe(false);

    if ("error" in result) {
      return;
    }

    expect(result.room.participants).toHaveLength(2);
    expect(result.room.hostId).toBe(host.participantId);
  });

  it("joinRoom is case-insensitive via uppercase room codes", () => {
    const host = createRoom("Alice");
    const lowerCode = host.room.code.toLowerCase();
    const result = joinRoom(lowerCode, "Bob");

    expect("error" in result).toBe(false);
  });

  it("joinRoom rejects rooms that are no longer in lobby status", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const result = joinRoom(host.room.code, "Charlie");

    expect(result).toEqual({ error: "not_lobby" });
  });

  it("rooms remain isolated from each other", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Bob");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    const joinA = joinRoom(roomA.room.code, "Carol");

    expect("error" in joinA).toBe(false);

    if ("error" in joinA) {
      return;
    }

    expect(joinA.room.participants.every((participant) => participant.name !== "Bob")).toBe(true);
  });

  it("startGame rejects when fewer than two players are present", () => {
    const host = createRoom("Alice");
    const result = startGame(host.room.code, host.participantId);

    expect(result).toEqual({ error: "not_enough_players" });
  });

  it("startGame rejects non-host participants", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if ("error" in guest) {
      throw new Error("Expected guest join to succeed");
    }

    const result = startGame(host.room.code, guest.participantId);

    expect(result).toEqual({ error: "not_host" });
  });

  it("startGame transitions the room to playing for the host", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect("error" in result).toBe(false);

    if ("error" in result) {
      return;
    }

    expect(result.room.status).toBe("playing");
  });

  it("startGame assigns the host as the sole drawer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if ("error" in guest) {
      throw new Error("Expected guest join to succeed");
    }

    const result = startGame(host.room.code, host.participantId);

    if ("error" in result) {
      throw new Error("Expected start to succeed");
    }

    expect(result.room.drawerId).toBe(host.participantId);

    const hostSnapshot = toRoomSnapshot(result.room, host.participantId);
    const guestSnapshot = toRoomSnapshot(result.room, guest.participantId);

    expect(hostSnapshot.drawerId).toBe(host.participantId);
    expect(hostSnapshot.participants.filter((entry) => entry.role === "drawer")).toHaveLength(1);
    expect(hostSnapshot.participants.filter((entry) => entry.role === "guesser")).toHaveLength(1);
    expect(guestSnapshot.drawerId).toBe(host.participantId);
  });

  it("startGame selects a deterministic starter-list word", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    if ("error" in result) {
      throw new Error("Expected start to succeed");
    }

    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(result.room.secretWord);

    const secondStart = startGame(host.room.code, host.participantId);

    expect(secondStart).toEqual({ error: "not_lobby" });
    expect(getRoom(host.room.code)?.secretWord).toBe(result.room.secretWord);
  });

  it("toRoomSnapshot hides the secret word from guessers", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if ("error" in guest) {
      throw new Error("Expected guest join to succeed");
    }

    const started = startGame(host.room.code, host.participantId);

    if ("error" in started) {
      throw new Error("Expected start to succeed");
    }

    const drawerSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(started.room, guest.participantId);

    expect(drawerSnapshot.viewerRole).toBe("drawer");
    expect(drawerSnapshot.secretWord).toBe(started.room.secretWord);
    expect(guesserSnapshot.viewerRole).toBe("guesser");
    expect(guesserSnapshot.secretWord).toBeNull();
  });
});
