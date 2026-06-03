import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  drawingUpdateSchema,
  guessSchema,
  participantActionSchema,
  roomCodeParamsSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema trims and accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects whitespace-only player names", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema normalizes lowercase codes", () => {
    expect(roomCodeParamsSchema.parse({ code: "abcd" }).code).toBe("ABCD");
  });

  it("roomCodeParamsSchema rejects malformed codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "abc" })).toThrow();
  });

  it("participantActionSchema requires participant id", () => {
    expect(() => participantActionSchema.parse({ participantId: "" })).toThrow();
  });

  it("drawingUpdateSchema accepts serializable strokes", () => {
    const result = drawingUpdateSchema.parse({
      participantId: "p1",
      strokes: [{ id: "s1", points: [{ x: 1, y: 2 }] }]
    });

    expect(result.strokes[0].points[0]).toEqual({ x: 1, y: 2 });
  });

  it("guessSchema trims guesses and rejects empty text", () => {
    expect(guessSchema.parse({ participantId: "p1", text: " rocket " }).text).toBe("rocket");
    expect(() => guessSchema.parse({ participantId: "p1", text: " " })).toThrow();
  });
});
