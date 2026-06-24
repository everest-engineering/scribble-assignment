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

  it("createRoom sets the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame rejects non-host participant", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    const guest = joinRoom(room.code, "Bob");
    expect(guest).not.toBeNull();

    expect(() => startGame(room.code, guest!.participantId)).toThrow(
      "Only the host can start the game"
    );
    void hostId;
  });

  it("startGame rejects when fewer than 2 players", () => {
    const { room, participantId: hostId } = createRoom("Alice");

    expect(() => startGame(room.code, hostId)).toThrow(
      "At least 2 players are required to start"
    );
  });

  it("startGame succeeds with host and 2 players", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");

    const updated = startGame(room.code, hostId);

    expect(updated.status).toBe("playing");
  });
});
