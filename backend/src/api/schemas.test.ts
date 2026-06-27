import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  startGameSchema
} from "./schemas.js";

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
      expect(() => createRoomSchema.parse({ playerName: "" })).toThrow("Player name is required");
    });

    it("rejects whitespace-only player name", () => {
      expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
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
      expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow("Player name is required");
    });

    it("rejects whitespace-only player name", () => {
      expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
    });
  });

  describe("startGameSchema", () => {
    it("accepts a valid playerId", () => {
      const result = startGameSchema.parse({ playerId: "some-uuid" });

      expect(result.playerId).toBe("some-uuid");
    });

    it("rejects missing playerId", () => {
      expect(() => startGameSchema.parse({})).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("accepts a valid room code", () => {
      const result = roomCodeParamsSchema.parse({ code: "ABCD" });

      expect(result.code).toBe("ABCD");
    });

    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });
  });
});
