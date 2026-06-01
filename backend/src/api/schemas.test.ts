import { describe, expect, it } from "vitest";
import {
  clearCanvasSchema,
  drawCanvasSchema,
  createRoomSchema,
  joinRoomSchema,
  normalizeGuessText,
  roomCodeParamsSchema,
  restartRoomSchema,
  submitGuessSchema,
  startRoomSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects whitespace-only player names", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
  });

  it("joinRoomSchema rejects missing player names", () => {
    expect(() => joinRoomSchema.parse({})).toThrow("Required");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects non-4-character codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow("Room code must be 4 characters");
  });

  it("startRoomSchema accepts a participantId", () => {
    const result = startRoomSchema.parse({ participantId: "p1", secretWord: "rocket" });

    expect(result.participantId).toBe("p1");
    expect(result.secretWord).toBe("rocket");
  });

  it("startRoomSchema rejects empty participant ids", () => {
    expect(() => startRoomSchema.parse({ participantId: "   ", secretWord: "rocket" })).toThrow("Participant id is required");
  });

  it("startRoomSchema rejects words outside the starter list", () => {
    expect(() => startRoomSchema.parse({ participantId: "p1", secretWord: "banana" })).toThrow();
  });

  it("restartRoomSchema accepts a participantId", () => {
    const result = restartRoomSchema.parse({ participantId: "p1" });

    expect(result.participantId).toBe("p1");
  });

  it("restartRoomSchema rejects empty participant ids", () => {
    expect(() => restartRoomSchema.parse({ participantId: "   " })).toThrow("Participant id is required");
  });

  it("drawCanvasSchema accepts a valid stroke payload", () => {
    const result = drawCanvasSchema.parse({
      participantId: "p1",
      stroke: {
        points: [{ x: 1, y: 2 }],
        color: "#111827",
        lineWidth: 4
      }
    });

    expect(result.stroke.points).toHaveLength(1);
  });

  it("clearCanvasSchema accepts a participant id", () => {
    const result = clearCanvasSchema.parse({ participantId: "p1" });

    expect(result.participantId).toBe("p1");
  });

  it("submitGuessSchema trims and rejects empty guesses", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", guessText: "  Rocket  " });

    expect(result.guessText).toBe("Rocket");
    expect(normalizeGuessText("  Rocket  ")).toBe("rocket");
    expect(() => submitGuessSchema.parse({ participantId: "p1", guessText: "   " })).toThrow("Guess text is required");
  });
});
