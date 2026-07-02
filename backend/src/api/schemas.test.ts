import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  drawingUpdateSchema,
  roomCodeParamsSchema,
  submitGuessSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("submitGuessSchema accepts participantId and text", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", text: "pizza" });
    expect(result.participantId).toBe("p1");
    expect(result.text).toBe("pizza");
  });

  it("drawingUpdateSchema accepts strokes payload", () => {
    const result = drawingUpdateSchema.parse({
      participantId: "p1",
      strokes: [{ points: [{ x: 10, y: 20 }, { x: 12, y: 22 }] }]
    });

    expect(result.strokes).toHaveLength(1);
    expect(result.strokes[0].points).toHaveLength(2);
  });
});
