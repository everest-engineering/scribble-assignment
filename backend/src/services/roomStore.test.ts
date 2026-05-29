import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRoom, toRoomSnapshot } from "./roomStore.js";
import { HttpError } from "../api/schemas.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participantId", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom trims player name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("  Alice  ");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom succeeds for a lobby room and snapshot includes hostId", () => {
    const host = createRoom("Alice");
    const result = joinRoom(host.room.code, "Bob");

    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
    expect(result!.room.hostId).toBe(host.participantId);
  });

  it("joinRoom throws 409 when room is active", () => {
    const host = createRoom("Alice");
    createRoom("Carol");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code, host.participantId);

    expect(() => joinRoom(host.room.code, "Dave")).toThrow(HttpError);

    try {
      joinRoom(host.room.code, "Dave");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect((error as HttpError).statusCode).toBe(409);
    }
  });

  it("room isolation: joining room A does not affect room B", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    joinRoom(roomA.room.code, "Bob");

    const afterA = joinRoom(roomA.room.code, "Dave");
    expect(afterA!.room.participants).toHaveLength(3);

    const fresh = joinRoom(roomB.room.code, "Eve");
    expect(fresh!.room.participants).toHaveLength(2);
    expect(roomA.room.code).not.toBe(roomB.room.code);
  });

  it("toRoomSnapshot includes hostId", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room);

    expect(snapshot.hostId).toBe(result.participantId);
  });

  describe("startRoom", () => {
    it("throws 404 for unknown room", () => {
      expect(() => startRoom("UNKN", "some-uuid")).toThrow(HttpError);

      try {
        startRoom("UNKN", "some-uuid");
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(404);
      }
    });

    it("throws 403 when caller is not host", () => {
      const host = createRoom("Alice");
      const guest = joinRoom(host.room.code, "Bob");

      expect(() => startRoom(host.room.code, guest!.participantId)).toThrow(HttpError);

      try {
        startRoom(host.room.code, guest!.participantId);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(403);
      }
    });

    it("throws 400 when fewer than 2 participants", () => {
      const host = createRoom("Alice");

      expect(() => startRoom(host.room.code, host.participantId)).toThrow(HttpError);

      try {
        startRoom(host.room.code, host.participantId);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(400);
      }
    });

    it("transitions room to active with host and ≥2 participants", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");

      const room = startRoom(host.room.code, host.participantId);

      expect(room.status).toBe("active");
      expect(room.hostId).toBe(host.participantId);
    });

    it("throws 409 when room already active", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      startRoom(host.room.code, host.participantId);

      expect(() => startRoom(host.room.code, host.participantId)).toThrow(HttpError);

      try {
        startRoom(host.room.code, host.participantId);
      } catch (error) {
        expect((error as HttpError).statusCode).toBe(409);
      }
    });
  });
});
