import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameBodySchema } from "./schemas.js";

describe("schemas", () => {
  describe("createRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = createRoomSchema.parse({ playerName: "Alice" });
      expect(result.playerName).toBe("Alice");
    });

    it("trims whitespace from playerName", () => {
      const result = createRoomSchema.parse({ playerName: "  Alice  " });
      expect(result.playerName).toBe("Alice");
    });

    it("rejects empty playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "" })).toThrow("Name is required");
    });

    it("rejects whitespace-only playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Name is required");
    });
  });

  describe("joinRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = joinRoomSchema.parse({ playerName: "Bob" });
      expect(result.playerName).toBe("Bob");
    });

    it("rejects empty playerName", () => {
      expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow("Name is required");
    });
  });

  describe("startGameBodySchema", () => {
    it("accepts a valid body with participantId", () => {
      const result = startGameBodySchema.parse({ participantId: "p1" });
      expect(result.participantId).toBe("p1");
    });

    it("rejects missing participantId", () => {
      expect(() => startGameBodySchema.parse({})).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });

    it("rejects empty code", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow("Room code is required");
    });
  });
});
