import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].isHost).toBe(true);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("toRoomSnapshot canStart is false with 1 player", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.canStart).toBe(false);
  });

  it("toRoomSnapshot canStart is true with 2+ players", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const room = getRoom(result.room.code);
    const snapshot = toRoomSnapshot(room!);

    expect(snapshot.canStart).toBe(true);
  });

  it("startGame returns null for non-host participant", () => {
    const result = createRoom("Alice");
    const joinResult = joinRoom(result.room.code, "Bob");

    expect(startGame(result.room.code, joinResult!.participantId)).toBeNull();
  });

  it("startGame returns null with fewer than 2 players", () => {
    const result = createRoom("Alice");

    expect(startGame(result.room.code, result.participantId)).toBeNull();
  });

  it("startGame returns room with status playing for host with 2+ players", () => {
    const result = createRoom("Alice");
    joinRoom(result.room.code, "Bob");
    const gameRoom = startGame(result.room.code, result.participantId);

    expect(gameRoom).not.toBeNull();
    expect(gameRoom!.status).toBe("playing");
  });
});
