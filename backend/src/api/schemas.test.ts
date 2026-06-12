import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameSchema, updateCanvasSchema, clearCanvasSchema, submitGuessSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims whitespace from playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("createRoomSchema rejects whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema accepts a valid body with playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "Bob" });

    expect(result.playerName).toBe("Bob");
  });

  it("joinRoomSchema rejects empty playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("joinRoomSchema rejects whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("startGameSchema requires participantId", () => {
    const result = startGameSchema.parse({ participantId: "p1" });

    expect(result.participantId).toBe("p1");
  });

  it("startGameSchema rejects missing participantId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });

  it("updateCanvasSchema accepts a valid stroke", () => {
    const result = updateCanvasSchema.parse({
      participantId: "p1",
      stroke: {
        points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
        color: "#000000",
        width: 4
      }
    });

    expect(result.stroke.points).toHaveLength(2);
    expect(result.stroke.color).toBe("#000000");
  });

  it("updateCanvasSchema rejects stroke with fewer than 2 points", () => {
    expect(() =>
      updateCanvasSchema.parse({
        participantId: "p1",
        stroke: {
          points: [{ x: 10, y: 10 }],
          color: "#000000",
          width: 4
        }
      })
    ).toThrow();
  });

  it("updateCanvasSchema rejects points outside 0-1000 range", () => {
    expect(() =>
      updateCanvasSchema.parse({
        participantId: "p1",
        stroke: {
          points: [{ x: -1, y: 10 }, { x: 20, y: 20 }],
          color: "#000000",
          width: 4
        }
      })
    ).toThrow();
  });

  it("clearCanvasSchema requires participantId", () => {
    const result = clearCanvasSchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("clearCanvasSchema rejects missing participantId", () => {
    expect(() => clearCanvasSchema.parse({})).toThrow();
  });

  it("submitGuessSchema accepts a valid guess", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", guess: "rocket" });
    expect(result.guess).toBe("rocket");
  });

  it("submitGuessSchema rejects empty guess", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1", guess: "" })).toThrow();
  });

  it("submitGuessSchema rejects missing participantId", () => {
    expect(() => submitGuessSchema.parse({ guess: "rocket" })).toThrow();
  });

  it("submitGuessSchema rejects guesses over 100 characters", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1", guess: "a".repeat(101) })).toThrow();
  });

  it("updateCanvasSchema rejects stroke with more than 500 points", () => {
    const points = Array.from({ length: 501 }, (_, i) => ({ x: i % 1000, y: i % 1000 }));
    expect(() =>
      updateCanvasSchema.parse({
        participantId: "p1",
        stroke: { points, color: "#000000", width: 4 }
      })
    ).toThrow();
  });
});
