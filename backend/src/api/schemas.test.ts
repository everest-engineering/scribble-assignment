import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema
} from "./schemas.js";

describe("schemas", () => {
  describe("createRoomSchema / joinRoomSchema", () => {
    it("accepts a valid playerName and trims surrounding whitespace", () => {
      expect(createRoomSchema.parse({ playerName: "  Alice  " })).toEqual({ playerName: "Alice" });
      expect(joinRoomSchema.parse({ playerName: "Bob" })).toEqual({ playerName: "Bob" });
    });

    it.each([{}, { playerName: "" }, { playerName: "   " }])(
      "rejects missing/empty/whitespace-only playerName: %j",
      (body) => {
        expect(() => createRoomSchema.parse(body)).toThrow();
        expect(() => joinRoomSchema.parse(body)).toThrow();
      }
    );

    it("rejects names longer than 24 chars", () => {
      expect(() => createRoomSchema.parse({ playerName: "x".repeat(25) })).toThrow();
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("rejects a missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });

    it.each(["", "   "])("rejects empty/whitespace-only code: %j", (code) => {
      expect(() => roomCodeParamsSchema.parse({ code })).toThrow();
    });

    it("trims and uppercases valid codes", () => {
      expect(roomCodeParamsSchema.parse({ code: "  abcd " })).toEqual({ code: "ABCD" });
      expect(roomCodeParamsSchema.parse({ code: "AbCd" })).toEqual({ code: "ABCD" });
    });
  });

  describe("startRoomSchema", () => {
    it("requires a non-empty participantId", () => {
      expect(startRoomSchema.parse({ participantId: "p1" })).toEqual({ participantId: "p1" });
      expect(() => startRoomSchema.parse({})).toThrow();
      expect(() => startRoomSchema.parse({ participantId: "" })).toThrow();
    });
  });
});
