import { describe, expect, it } from "vitest";
import {
  appendDrawingSchema,
  clearDrawingSchema,
  createRoomSchema,
  drawingPointSchema,
  drawingStrokeSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";

describe("createRoomSchema", () => {
  it("accepts a valid player name", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });
    expect(result.playerName).toBe("Alice");
  });

  it("trims whitespace from player name", () => {
    const result = createRoomSchema.parse({ playerName: "  Bob  " });
    expect(result.playerName).toBe("Bob");
  });

  it("rejects empty player name after trimming", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("rejects whitespace-only name", () => {
    expect(() => createRoomSchema.parse({ playerName: " \t\n " })).toThrow();
  });
});

describe("joinRoomSchema", () => {
  it("accepts a valid player name", () => {
    const result = joinRoomSchema.parse({ playerName: "Charlie" });
    expect(result.playerName).toBe("Charlie");
  });

  it("trims whitespace from player name", () => {
    const result = joinRoomSchema.parse({ playerName: "  Dave  " });
    expect(result.playerName).toBe("Dave");
  });

  it("rejects empty player name", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejects whitespace-only name", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });
});

describe("roomCodeParamsSchema", () => {
  it("accepts a valid 4-character code", () => {
    const result = roomCodeParamsSchema.parse({ code: "ABCD" });
    expect(result.code).toBe("ABCD");
  });

  it("rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("rejects code shorter than 4 characters", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "AB" })).toThrow();
  });

  it("rejects code longer than 4 characters", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABCDE" })).toThrow();
  });
});

describe("roomViewerQuerySchema", () => {
  it("accepts a participantId", () => {
    const result = roomViewerQuerySchema.parse({ participantId: "some-uuid" });
    expect(result.participantId).toBe("some-uuid");
  });

  it("accepts missing participantId", () => {
    const result = roomViewerQuerySchema.parse({});
    expect(result.participantId).toBeUndefined();
  });
});

describe("startGameSchema", () => {
  it("accepts a valid participantId", () => {
    const result = startGameSchema.parse({ participantId: "some-uuid" });
    expect(result.participantId).toBe("some-uuid");
  });

  it("rejects missing participantId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });
});

describe("drawingPointSchema", () => {
  it("accepts valid normalized coordinates", () => {
    const result = drawingPointSchema.parse({ x: 0.5, y: 0.75 });
    expect(result.x).toBe(0.5);
    expect(result.y).toBe(0.75);
  });

  it("rejects x less than 0", () => {
    expect(() => drawingPointSchema.parse({ x: -0.1, y: 0.5 })).toThrow();
  });

  it("rejects x greater than 1", () => {
    expect(() => drawingPointSchema.parse({ x: 1.1, y: 0.5 })).toThrow();
  });

  it("rejects non-finite coordinate", () => {
    expect(() => drawingPointSchema.parse({ x: NaN, y: 0.5 })).toThrow();
  });
});

describe("drawingStrokeSchema", () => {
  it("accepts a valid stroke", () => {
    const result = drawingStrokeSchema.parse({
      color: "#111827",
      size: 4,
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
    });
    expect(result.color).toBe("#111827");
    expect(result.size).toBe(4);
    expect(result.points).toHaveLength(2);
  });

  it("rejects a stroke with fewer than 2 points", () => {
    expect(() =>
      drawingStrokeSchema.parse({
        color: "#111827",
        size: 4,
        points: [{ x: 0.1, y: 0.2 }]
      })
    ).toThrow();
  });

  it("rejects a stroke with more than 500 points", () => {
    const points = Array.from({ length: 501 }, (_, i) => ({ x: i / 500, y: (i % 100) / 100 }));
    expect(() =>
      drawingStrokeSchema.parse({ color: "#111827", size: 4, points })
    ).toThrow();
  });

  it("rejects invalid color format", () => {
    expect(() =>
      drawingStrokeSchema.parse({
        color: "red",
        size: 4,
        points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
      })
    ).toThrow();
  });

  it("rejects brush size less than 1", () => {
    expect(() =>
      drawingStrokeSchema.parse({
        color: "#111827",
        size: 0,
        points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
      })
    ).toThrow();
  });

  it("rejects brush size greater than 20", () => {
    expect(() =>
      drawingStrokeSchema.parse({
        color: "#111827",
        size: 21,
        points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
      })
    ).toThrow();
  });
});

describe("appendDrawingSchema", () => {
  it("accepts a valid append drawing request", () => {
    const result = appendDrawingSchema.parse({
      participantId: "p1",
      stroke: {
        color: "#111827",
        size: 4,
        points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
      }
    });
    expect(result.participantId).toBe("p1");
  });

  it("rejects missing participantId", () => {
    expect(() =>
      appendDrawingSchema.parse({
        stroke: {
          color: "#111827",
          size: 4,
          points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
        }
      })
    ).toThrow();
  });
});

describe("clearDrawingSchema", () => {
  it("accepts a valid clear drawing request", () => {
    const result = clearDrawingSchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("rejects missing participantId", () => {
    expect(() => clearDrawingSchema.parse({})).toThrow();
  });
});

describe("submitGuessSchema", () => {
  it("accepts a valid guess", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", guess: "rocket" });
    expect(result.guess).toBe("rocket");
  });

  it("trims whitespace from guess", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", guess: "  rocket  " });
    expect(result.guess).toBe("rocket");
  });

  it("rejects empty guess after trimming", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1", guess: "   " })).toThrow();
  });

  it("rejects missing guess", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1" })).toThrow();
  });
});
