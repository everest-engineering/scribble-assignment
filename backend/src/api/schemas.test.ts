import { describe, expect, it } from "vitest";
import {
  clearCanvasSchema,
  createRoomSchema,
  guessSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema,
  strokeSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  // T007 [US1]
  it("create/join schemas reject empty and whitespace-only names", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: "\t \n" })).toThrow();
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  // T007 [US1]
  it("create/join schemas trim accepted names", () => {
    expect(createRoomSchema.parse({ playerName: "  Ada " }).playerName).toBe("Ada");
    expect(joinRoomSchema.parse({ playerName: "  Bob  " }).playerName).toBe("Bob");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  // T012 [US2]
  it("roomCodeParamsSchema trims and uppercases the code", () => {
    const result = roomCodeParamsSchema.parse({ code: "  abcd  " });

    expect(result.code).toBe("ABCD");
  });

  // T012 [US2]
  it("roomCodeParamsSchema rejects empty/whitespace codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
  });

  // T022 [US4]
  it("startRoomSchema rejects missing or empty participantId", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
    expect(() => startRoomSchema.parse({ participantId: "" })).toThrow();
    expect(startRoomSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
  });

  // T009 [US1]
  it("strokeSchema requires at least one point and rejects oversized strokes", () => {
    expect(strokeSchema.parse({ participantId: "p1", stroke: { points: [{ x: 1, y: 2 }] } })).toBeTruthy();
    expect(() => strokeSchema.parse({ participantId: "p1", stroke: { points: [] } })).toThrow();
    const tooMany = { points: Array.from({ length: 2001 }, () => ({ x: 0, y: 0 })) };
    expect(() => strokeSchema.parse({ participantId: "p1", stroke: tooMany })).toThrow();
    expect(() => strokeSchema.parse({ participantId: "p1", stroke: { points: [{ x: "a", y: 2 }] } })).toThrow();
  });

  // T009 [US1]
  it("clearCanvasSchema requires a non-empty participantId", () => {
    expect(clearCanvasSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
    expect(() => clearCanvasSchema.parse({ participantId: "" })).toThrow();
  });

  // T017 [US2]
  it("guessSchema rejects empty/whitespace guesses and trims valid ones", () => {
    expect(() => guessSchema.parse({ participantId: "p1", guess: "" })).toThrow();
    expect(() => guessSchema.parse({ participantId: "p1", guess: "   " })).toThrow();
    expect(() => guessSchema.parse({ participantId: "", guess: "cat" })).toThrow();
    expect(guessSchema.parse({ participantId: "p1", guess: "  cat " }).guess).toBe("cat");
  });
});
