import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, startGame } from "./roomStore.js";

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code and assigns host", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.room.hostId).toBe(result.participantId);
      expect(result.participantId).toBeDefined();
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");

      expect(result).toBeNull();
    });

    it("adds a participant to an existing room", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Bob");

      expect(result).not.toBeNull();
      expect(result!.room.participants).toHaveLength(2);
      expect(result!.room.participants[1].name).toBe("Bob");
    });
  });

  describe("startGame", () => {
    it("starts the game when host calls with 2+ players", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("playing");
      }
    });

    it("returns error when non-host tries to start", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const bobResult = joinRoom(host.room.code, "Charlie");
      const result = startGame(host.room.code, bobResult!.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.error).toContain("host");
      }
    });

    it("returns error when fewer than 2 players", () => {
      const host = createRoom("Alice");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("2 players");
      }
    });

    it("returns error for unknown room", () => {
      const result = startGame("ZZZZ", "some-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
      }
    });
  });

  describe("getRoom", () => {
    it("returns null for an unknown code", () => {
      expect(getRoom("ZZZZ")).toBeNull();
    });

    it("returns a cloned room for an existing code", () => {
      const created = createRoom("Alice");
      const room = getRoom(created.room.code);

      expect(room).not.toBeNull();
      expect(room!.code).toBe(created.room.code);
    });
  });
});
