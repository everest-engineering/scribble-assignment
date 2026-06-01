import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, normalizeCode, startGame } from "./roomStore.js";

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.participantId).toBeDefined();
    });

    it("assigns the creator as host", () => {
      const result = createRoom("Alice");
      expect(result.room.hostParticipantId).toBe(result.participantId);
    });

    it("sets status to lobby", () => {
      const result = createRoom("Alice");
      expect(result.room.status).toBe("lobby");
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");
      expect(result).toBeNull();
    });

    it("normalizes room code before lookup", () => {
      const created = createRoom("Alice");
      const result = joinRoom(created.room.code.toLowerCase(), "Bob");
      expect(result).not.toBeNull();
      expect(result!.room.participants).toHaveLength(2);
    });

    it("does not mutate any room on invalid code", () => {
      const created = createRoom("Alice");
      const snapshotBefore = getRoom(created.room.code);
      const result = joinRoom("ZZZZ", "Bob");
      expect(result).toBeNull();
      const snapshotAfter = getRoom(created.room.code);
      expect(snapshotAfter!.participants).toHaveLength(
        snapshotBefore!.participants.length
      );
    });

    it("isolates rooms: joining one room does not affect another", () => {
      const room1 = createRoom("Alice");
      const room2 = createRoom("Charlie");
      joinRoom(room1.room.code, "Bob");
      const snap1 = getRoom(room1.room.code);
      const snap2 = getRoom(room2.room.code);
      expect(snap1!.participants).toHaveLength(2);
      expect(snap2!.participants).toHaveLength(1);
    });
  });

  describe("getRoom", () => {
    it("normalizes code when fetching", () => {
      const created = createRoom("Alice");
      const fetched = getRoom(created.room.code.toLowerCase());
      expect(fetched).not.toBeNull();
      expect(fetched!.code).toBe(created.room.code);
    });

    it("returns null for non-existent room", () => {
      expect(getRoom("NONEXIST")).toBeNull();
    });
  });

  describe("startGame", () => {
    it("rejects start with fewer than 2 players", () => {
      const created = createRoom("Alice");
      expect(() =>
        startGame(created.room.code, created.participantId)
      ).toThrow("At least 2 players are needed to start");
    });

    it("rejects start by non-host participant", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob");
      expect(() =>
        startGame(created.room.code, joiner!.participantId)
      ).toThrow("Only the host can start the game");
    });

    it("allows host to start with 2 players", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      const result = startGame(created.room.code, created.participantId);
      expect(result.status).toBe("inGame");
    });

    it("transitions room status to inGame on successful start", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      const snap = getRoom(created.room.code);
      expect(snap!.status).toBe("inGame");
    });
  });

  describe("normalizeCode", () => {
    it("trims and uppercases room code", () => {
      expect(normalizeCode("  abcd  ")).toBe("ABCD");
    });
  });
});
