import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].role).toBe("guesser");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame assigns drawer role to host and guesser to others", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    const drawer = result.room!.participants.find((p) => p.role === "drawer");
    const guessers = result.room!.participants.filter((p) => p.role === "guesser");
    expect(drawer?.id).toBe(host.participantId);
    expect(drawer?.name).toBe("Host");
    expect(guessers).toHaveLength(1);
    expect(guessers[0].name).toBe("Guest");
  });

  it("startGame sets status to playing and selects first word", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");

    const result = startGame(host.room.code, host.participantId);

    expect(result.room!.status).toBe("playing");
    expect(result.room!.currentWord).toBe("rocket");
    expect(result.room!.currentRound).toBe(1);
  });

  it("startGame rejects non-host player", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");

    const result = startGame(host.room.code, guest!.participantId);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("Only the host can start the game");
  });

  it("startGame rejects when less than 2 players", () => {
    const host = createRoom("Host");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(false);
    expect(result.error).toBe("At least 2 players are required to start");
  });

  it("toRoomSnapshot shows word to drawer and hides from guesser", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);

    const drawerSnapshot = toRoomSnapshot(started.room!, host.participantId);
    expect(drawerSnapshot.currentWord).toBe("rocket");
    expect(drawerSnapshot.currentWordLength).toBe(6);

    const guestId = started.room!.participants.find((p) => p.name === "Guest")!.id;
    const guesserSnapshot = toRoomSnapshot(started.room!, guestId);
    expect(guesserSnapshot.currentWord).toBeNull();
    expect(guesserSnapshot.currentWordLength).toBe(6);
  });

  it("toRoomSnapshot includes currentRound in snapshot", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);
    const snapshot = toRoomSnapshot(started.room!, host.participantId);

    expect(snapshot.currentRound).toBe(1);
  });
});
