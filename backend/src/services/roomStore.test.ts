import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  MAX_PARTICIPANTS,
  normalizePlayerName,
  PlayerNameValidationError,
  RoomCapacityError
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostParticipantId to the creator", () => {
    const result = createRoom("Alice");

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("normalizePlayerName rejects empty names", () => {
    expect(() => normalizePlayerName("   ")).toThrow(PlayerNameValidationError);
  });

  it("normalizePlayerName rejects names longer than 24 characters", () => {
    expect(() => normalizePlayerName("a".repeat(25))).toThrow(PlayerNameValidationError);
  });

  it("joinRoom rejects when room is full", () => {
    const host = createRoom("Host");
    const code = host.room.code;

    for (let index = 1; index < MAX_PARTICIPANTS; index += 1) {
      joinRoom(code, `Player${index}`);
    }

    expect(() => joinRoom(code, "Overflow")).toThrow(RoomCapacityError);
  });
});
