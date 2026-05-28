import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the first participant id", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame sets status to playing when host starts with 2+ players", () => {
    const { room, participantId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const started = startGame(room.code, participantId);

    expect(started.status).toBe("playing");
  });

  it("startGame throws 403 when non-host tries to start", () => {
    const { room } = createRoom("Alice");
    const join = joinRoom(room.code, "Bob");

    expect(() => startGame(room.code, join!.participantId)).toThrow("Only the host can start the game");
  });

  it("startGame throws 403 when fewer than 2 players are present", () => {
    const { room, participantId } = createRoom("Alice");

    expect(() => startGame(room.code, participantId)).toThrow("Need at least 2 players to start");
  });
});
