import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom trims player names", () => {
    const result = createRoom("  Alex  ");

    expect(result.room.participants[0].name).toBe("Alex");
  });

  it("createRoom sets hostId to the creator participant id", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.hostId).toBe(result.room.participants[0].id);
  });

  it("joinRoom returns not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ status: "not_found" });
  });

  it("joinRoom trims player names", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "  Bob  ");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    expect(guest.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom rejects when the game has already started", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    const started = startGame(host.room.code, host.participantId);

    if (started.status !== "started") {
      throw new Error("Expected game to start");
    }

    const lateJoin = joinRoom(host.room.code, "Carol");

    expect(lateJoin).toEqual({ status: "in_progress" });
  });

  it("startGame requires the host participant", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    const result = startGame(host.room.code, guest.participantId);

    expect(result).toEqual({ status: "not_host" });
  });

  it("startGame requires at least two players", () => {
    const host = createRoom("Alice");
    const result = startGame(host.room.code, host.participantId);

    expect(result).toEqual({ status: "not_enough_players" });
  });

  it("startGame transitions lobby to playing for the host with two players", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    const result = startGame(host.room.code, host.participantId);

    expect(result.status).toBe("started");

    if (result.status === "started") {
      expect(result.room.status).toBe("playing");
    }
  });

  it("startGame assigns the host as drawer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    const result = startGame(host.room.code, host.participantId);

    if (result.status !== "started") {
      throw new Error("Expected game to start");
    }

    expect(result.room.drawerId).toBe(host.participantId);
    expect(result.room.drawerId).toBe(host.room.hostId);
  });

  it("startGame initializes scores to zero for all participants", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    const result = startGame(host.room.code, host.participantId);

    if (result.status !== "started") {
      throw new Error("Expected game to start");
    }

    expect(result.room.scores[host.participantId]).toBe(0);
    expect(result.room.scores[guest.participantId]).toBe(0);
  });

  it("toRoomSnapshot includes secretWord only for the drawer viewer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    const started = startGame(host.room.code, host.participantId);

    if (started.status !== "started") {
      throw new Error("Expected game to start");
    }

    const drawerSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(started.room, guest.participantId);
    const anonymousSnapshot = toRoomSnapshot(started.room);

    expect(drawerSnapshot.secretWord).toBe(started.room.secretWord);
    expect(guesserSnapshot.secretWord).toBeUndefined();
    expect(anonymousSnapshot.secretWord).toBeUndefined();
  });

  it("toRoomSnapshot omits availableWords when playing", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if (guest.status !== "joined") {
      throw new Error("Expected guest to join");
    }

    const started = startGame(host.room.code, host.participantId);

    if (started.status !== "started") {
      throw new Error("Expected game to start");
    }

    const lobbySnapshot = toRoomSnapshot(host.room, host.participantId);
    const playingSnapshot = toRoomSnapshot(started.room, host.participantId);

    expect(lobbySnapshot.availableWords).toBeDefined();
    expect(playingSnapshot.availableWords).toBeUndefined();
  });
});
