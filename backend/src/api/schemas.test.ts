import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

describe("schemas", () => {
  describe("createRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = createRoomSchema.parse({ playerName: "Alice" });

      expect(result.playerName).toBe("Alice");
    });

    it("rejects missing playerName", () => {
      expect(() => createRoomSchema.parse({})).toThrow();
    });

    it("rejects whitespace-only playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    });

    it("trims leading/trailing whitespace", () => {
      const result = createRoomSchema.parse({ playerName: "  Bob  " });

      expect(result.playerName).toBe("Bob");
    });

    it("rejects playerName longer than 20 characters", () => {
      expect(() => createRoomSchema.parse({ playerName: "A".repeat(21) })).toThrow();
    });
  });

  describe("joinRoomSchema", () => {
    it("accepts a valid playerName", () => {
      const result = joinRoomSchema.parse({ playerName: "Bob" });

      expect(result.playerName).toBe("Bob");
    });

    it("rejects missing playerName", () => {
      expect(() => joinRoomSchema.parse({})).toThrow();
    });

    it("rejects whitespace-only playerName", () => {
      expect(() => joinRoomSchema.parse({ playerName: "  " })).toThrow();
    });
  });

  describe("startGameSchema", () => {
    it("accepts a valid UUID participantId", () => {
      const id = "550e8400-e29b-41d4-a716-446655440000";
      const result = startGameSchema.parse({ participantId: id });

      expect(result.participantId).toBe(id);
    });

    it("rejects missing participantId", () => {
      expect(() => startGameSchema.parse({})).toThrow();
    });

    it("rejects non-UUID participantId", () => {
      expect(() => startGameSchema.parse({ participantId: "not-a-uuid" })).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });
  });
});
