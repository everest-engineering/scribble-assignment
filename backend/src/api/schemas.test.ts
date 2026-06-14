import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  endRoundSchema,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema,
  submitGuessSchema
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

  // FR-002 (US1)
  describe("submitGuessSchema", () => {
    it("parses a valid body and TRIMS the text", () => {
      expect(submitGuessSchema.parse({ participantId: "p1", text: "  Rocket  " })).toEqual({
        participantId: "p1",
        text: "Rocket"
      });
    });

    it.each([
      { participantId: "p1", text: "" },
      { participantId: "p1", text: "    " },
      { participantId: "p1", text: "x".repeat(51) },
      { participantId: "", text: "rocket" },
      { text: "rocket" },
      { participantId: "p1" }
    ])("rejects invalid body: %j", (body) => {
      expect(() => submitGuessSchema.parse(body)).toThrow();
    });

    it("accepts exactly 50 characters after trim", () => {
      const text = "a".repeat(50);
      expect(submitGuessSchema.parse({ participantId: "p1", text })).toEqual({
        participantId: "p1",
        text
      });
    });
  });

  describe("endRoundSchema / restartRoomSchema", () => {
    it("parses a valid body with participantId", () => {
      expect(endRoundSchema.parse({ participantId: "p-alice" })).toEqual({
        participantId: "p-alice"
      });
      expect(restartRoomSchema.parse({ participantId: "p-alice" })).toEqual({
        participantId: "p-alice"
      });
    });

    it.each([{}, { participantId: "" }])(
      "rejects missing/empty participantId: %j",
      (body) => {
        expect(() => endRoundSchema.parse(body)).toThrow();
        expect(() => restartRoomSchema.parse(body)).toThrow();
      }
    );
  });
});
