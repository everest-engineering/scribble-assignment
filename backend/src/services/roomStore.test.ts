import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, submitGuess, restartGame, getRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to creator participantId", () => {
    const result = createRoom("Alice");
    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom initializes scores as empty", () => {
    const result = createRoom("Alice");
    expect(result.room.scores).toEqual({});
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");
    expect(result).toBeNull();
  });

  it("joinRoom adds participant to existing room", () => {
    const host = createRoom("Alice");
    const result = joinRoom(host.room.code, "Bob");
    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
  });

  it("startGame returns null for unknown room", () => {
    const result = startGame("ZZZZ", "anyone");
    expect(result).toBeNull();
  });

  it("startGame returns null when non-host tries to start", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const result = startGame(host.room.code, "wrong-id");
    expect(result).toBeNull();
  });

  it("startGame returns null with fewer than 2 players", () => {
    const host = createRoom("Alice");
    const result = startGame(host.room.code, host.participantId);
    expect(result).toBeNull();
  });

  it("startGame assigns drawer and secret word", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const room = startGame(host.room.code, host.participantId);
    expect(room).not.toBeNull();
    expect(room!.drawerId).toBe(host.participantId);
    expect(room!.secretWord).toBeTruthy();
    expect(room!.status).toBe("playing");
  });

  it("startGame resets scores to 0 for all participants", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const room = startGame(host.room.code, host.participantId);
    expect(Object.values(room!.scores)).toEqual([0, 0]);
  });

  it("submitGuess returns null when game not started", () => {
    const host = createRoom("Alice");
    const result = submitGuess(host.room.code, host.participantId, "rocket");
    expect(result).toBeNull();
  });

  it("submitGuess returns null for drawer guessing", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const room = startGame(host.room.code, host.participantId);
    const guesserId = room!.participants[1].id;
    const result = submitGuess(host.room.code, host.participantId, "test");
    expect(result).toBeNull();
  });

  it("restartGame returns to lobby and preserves participants", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const room = startGame(host.room.code, host.participantId);
    const result = restartGame(host.room.code, host.participantId);
    expect(result).not.toBeNull();
    expect(result!.status).toBe("lobby");
    expect(result!.participants).toHaveLength(2);
    expect(result!.drawerId).toBeNull();
    expect(result!.secretWord).toBeNull();
  });
});
