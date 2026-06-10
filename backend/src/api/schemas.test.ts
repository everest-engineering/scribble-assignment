import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, playerNameSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  describe("playerNameSchema", () => {
    const validNames = ["Alice", "Bob-123", "hello world", "test_name", "a", "A".repeat(15)];
    for (const name of validNames) {
      it(`accepts "${name}"`, () => {
        expect(playerNameSchema.parse(name)).toBe(name);
      });
    }

    const invalidNames = ["", "  ", "@lice", "name!with", "a🐱b", "toolongname12345!"];
    for (const name of invalidNames) {
      it(`rejects "${name}"`, () => {
        expect(() => playerNameSchema.parse(name)).toThrow();
      });
    }

    it("trims whitespace", () => {
      expect(playerNameSchema.parse("  Alice  ")).toBe("Alice");
    });

    it("rejects name over 15 chars", () => {
      expect(() => playerNameSchema.parse("A".repeat(16))).toThrow();
    });
  });

  describe("createRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = createRoomSchema.parse({ playerName: "Alice" });
      expect(result.playerName).toBe("Alice");
    });

    it("accepts missing playerName", () => {
      const result = createRoomSchema.parse({});
      expect(result.playerName).toBeUndefined();
    });

    it("rejects invalid playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    });
  });

  describe("joinRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = joinRoomSchema.parse({ playerName: "Bob" });
      expect(result.playerName).toBe("Bob");
    });

    it("accepts missing playerName", () => {
      const result = joinRoomSchema.parse({});
      expect(result.playerName).toBeUndefined();
    });

    it("rejects invalid playerName", () => {
      expect(() => joinRoomSchema.parse({ playerName: "@bad" })).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("accepts a valid 4-char uppercase code", () => {
      const result = roomCodeParamsSchema.parse({ code: "ABCD" });
      expect(result.code).toBe("ABCD");
    });

    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });

    it("rejects short code", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "AB" })).toThrow();
    });
  });
});
