import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame } from "./roomStore.js";
import { HttpError } from "../models/game.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participant ID", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom trims player name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("createRoom rejects empty player name", () => {
    expect(() => createRoom("")).toThrow(HttpError);
    expect(() => createRoom("   ")).toThrow(HttpError);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom trims player name", () => {
    const room = createRoom("Alice");
    const result = joinRoom(room.room.code, "  Bob  ");

    expect(result).not.toBeNull();
    expect(result!.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom rejects empty player name", () => {
    const room = createRoom("Alice");

    expect(() => joinRoom(room.room.code, "")).toThrow(HttpError);
    expect(() => joinRoom(room.room.code, "   ")).toThrow(HttpError);
  });

  it("startGame returns updated room when host starts with 2+ players", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect(result).not.toBeNull();
    expect(result!.status).toBe("playing");
  });

  it("startGame returns null for unknown room code", () => {
    const result = startGame("ZZZZ", "some-id");

    expect(result).toBeNull();
  });

  it("startGame rejects non-host requester", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(() => startGame(host.room.code, guest!.participantId)).toThrow(HttpError);
    expect(() => startGame(host.room.code, guest!.participantId)).toThrow("Only the host can start the game");
  });

  it("startGame rejects when fewer than 2 players", () => {
    const host = createRoom("Alice");

    expect(() => startGame(host.room.code, host.participantId)).toThrow(HttpError);
    expect(() => startGame(host.room.code, host.participantId)).toThrow("Need at least 2 players to start");
  });

  it("startGame rejects when game already started", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    expect(() => startGame(host.room.code, host.participantId)).toThrow(HttpError);
    expect(() => startGame(host.room.code, host.participantId)).toThrow("Game already started");
  });

  it("toRoomSnapshot includes hostId", () => {
    const room = createRoom("Alice");
    const snapshot = getRoom(room.room.code);

    expect(snapshot).not.toBeNull();
    expect(snapshot!.hostId).toBe(room.participantId);
  });
});