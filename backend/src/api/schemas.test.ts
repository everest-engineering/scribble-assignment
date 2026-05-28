import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  endRoundSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  submitGuessSchema,
  updateDrawingSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty or whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema accepts valid codes and normalizes them", () => {
    const result = roomCodeParamsSchema.parse({ code: "  abcd  " });
    expect(result.code).toBe("ABCD");
  });

  it("roomCodeParamsSchema rejects invalid formats", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "ABCDE" })).toThrow();
  });

  it("updateDrawingSchema accepts bounded drawing strokes", () => {
    const result = updateDrawingSchema.parse({
      participantId: "p1",
      drawing: [
        {
          id: "stroke-1",
          color: "#2563eb",
          size: 6,
          points: [
            { x: 0, y: 0.5 },
            { x: 1, y: 1 }
          ]
        }
      ]
    });

    expect(result.drawing).toHaveLength(1);
  });

  it("updateDrawingSchema rejects invalid points and colors", () => {
    expect(() =>
      updateDrawingSchema.parse({
        participantId: "p1",
        drawing: [{ id: "stroke-1", color: "blue", size: 6, points: [{ x: 1.1, y: 0.5 }] }]
      })
    ).toThrow();
  });

  it("submitGuessSchema trims guesses and rejects empty guesses", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", text: "  Rocket  " });

    expect(result.text).toBe("Rocket");
    expect(() => submitGuessSchema.parse({ participantId: "p1", text: "   " })).toThrow();
  });

  it("endRoundSchema and restartRoomSchema require participant IDs", () => {
    expect(endRoundSchema.parse({ participantId: "  p1  " }).participantId).toBe("p1");
    expect(restartRoomSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
    expect(() => endRoundSchema.parse({ participantId: "   " })).toThrow();
    expect(() => restartRoomSchema.parse({})).toThrow();
  });
});
