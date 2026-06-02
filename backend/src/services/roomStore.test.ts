import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  startRoom,
  toRoomSnapshot,
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom snapshot hostId equals the returned participantId", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom throws 409 HttpError when room status is playing", () => {
    const { room } = createRoom("Alice");
    startRoom(room.code);

    expect(() => joinRoom(room.code, "Bob")).toThrowError(
      "Game already in progress",
    );
  });

  it("startRoom changes status to playing and returns snapshot", () => {
    const { room } = createRoom("Alice");
    const snapshot = startRoom(room.code);

    expect(snapshot.status).toBe("playing");
    expect(snapshot.code).toBe(room.code);
  });

  it("startRoom throws 404 HttpError for an unknown room code", () => {
    expect(() => startRoom("ZZZZ")).toThrowError("Room not found");
  });
});
