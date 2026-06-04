import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

describe("schemas", () => {
  describe("createRoomSchema", () => {
    it("accepts a valid player name", () => {
      const result = createRoomSchema.parse({ playerName: "Alice" });
      expect(result.playerName).toBe("Alice");
    });

    it("trims whitespace from player name", () => {
      const result = createRoomSchema.parse({ playerName: "  Alice  " });
      expect(result.playerName).toBe("Alice");
    });

    it("rejects empty player name", () => {
      expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    });

    it("rejects whitespace-only player name", () => {
      expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    });

    it("rejects missing player name", () => {
      expect(() => createRoomSchema.parse({})).toThrow();
    });
  });

  describe("joinRoomSchema", () => {
    it("accepts a valid player name", () => {
      const result = joinRoomSchema.parse({ playerName: "Bob" });
      expect(result.playerName).toBe("Bob");
    });

    it("trims whitespace from player name", () => {
      const result = joinRoomSchema.parse({ playerName: "  Bob  " });
      expect(result.playerName).toBe("Bob");
    });

    it("rejects empty player name", () => {
      expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });

    it("rejects empty code", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    });

    it("accepts valid code", () => {
      const result = roomCodeParamsSchema.parse({ code: "ABCD" });
      expect(result.code).toBe("ABCD");
    });
  });

  describe("startGameSchema", () => {
    it("rejects missing participantId", () => {
      expect(() => startGameSchema.parse({})).toThrow();
    });

    it("rejects empty participantId", () => {
      expect(() => startGameSchema.parse({ participantId: "" })).toThrow();
    });

    it("accepts valid participantId", () => {
      const result = startGameSchema.parse({ participantId: "abc-123" });
      expect(result.participantId).toBe("abc-123");
    });
  });
});
