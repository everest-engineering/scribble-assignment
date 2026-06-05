import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startRoomBodySchema } from "./schemas.js";

describe("schemas", () => {
  describe("createRoomSchema", () => {
    it("accepts a valid playerName", () => {
      const result = createRoomSchema.parse({ playerName: "Alice" });
      expect(result.playerName).toBe("Alice");
    });

    it("trims whitespace from playerName", () => {
      const result = createRoomSchema.parse({ playerName: "  Alice  " });
      expect(result.playerName).toBe("Alice");
    });

    it("rejects an empty playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    });

    it("rejects a whitespace-only playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    });

    it("rejects missing playerName", () => {
      expect(() => createRoomSchema.parse({})).toThrow();
    });
  });

  describe("joinRoomSchema", () => {
    it("accepts a valid playerName", () => {
      const result = joinRoomSchema.parse({ playerName: "Bob" });
      expect(result.playerName).toBe("Bob");
    });

    it("rejects an empty playerName", () => {
      expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
    });

    it("rejects missing playerName", () => {
      expect(() => joinRoomSchema.parse({})).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("accepts a valid 4-char code", () => {
      const result = roomCodeParamsSchema.parse({ code: "AB2C" });
      expect(result.code).toBe("AB2C");
    });

    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });

    it("rejects a code shorter than 4 characters", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
    });

    it("rejects a code longer than 4 characters", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "ABCDE" })).toThrow();
    });

    it("rejects lowercase characters", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "ab2c" })).toThrow();
    });

    it("rejects excluded characters (O, I, L, 1, 0)", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "ABO1" })).toThrow();
    });
  });

  describe("startRoomBodySchema", () => {
    it("accepts a valid UUID participantId", () => {
      const id = "123e4567-e89b-12d3-a456-426614174000";
      const result = startRoomBodySchema.parse({ participantId: id });
      expect(result.participantId).toBe(id);
    });

    it("rejects missing participantId", () => {
      expect(() => startRoomBodySchema.parse({})).toThrow();
    });

    it("rejects a non-UUID participantId", () => {
      expect(() => startRoomBodySchema.parse({ participantId: "not-a-uuid" })).toThrow();
    });
  });
});
