import { describe, expect, it } from "vitest";
import {
  addStrokeSchema,
  clearCanvasSchema,
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  submitGuessSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty and whitespace-only names", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema rejects empty and whitespace-only names", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema trims playerName", () => {
    const result = joinRoomSchema.parse({ playerName: " Bob " });

    expect(result.playerName).toBe("Bob");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects empty and whitespace-only codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("roomCodeParamsSchema accepts trimmed non-empty codes", () => {
    const result = roomCodeParamsSchema.parse({ code: " abcd " });

    expect(result.code).toBe("abcd");
  });

  it("addStrokeSchema accepts a valid stroke payload", () => {
    const result = addStrokeSchema.parse({
      participantId: "p1",
      stroke: { points: [{ x: 0.1, y: 0.2 }] }
    });

    expect(result.stroke.points).toHaveLength(1);
  });

  it("clearCanvasSchema requires participantId", () => {
    expect(() => clearCanvasSchema.parse({})).toThrow();
  });

  it("submitGuessSchema trims and rejects empty guesses", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1", guessText: "   " })).toThrow();

    const result = submitGuessSchema.parse({ participantId: "p1", guessText: " rocket " });
    expect(result.guessText).toBe("rocket");
  });
});
