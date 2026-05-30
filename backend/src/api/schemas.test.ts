import { describe, expect, it } from "vitest";
import {
  clearCanvasSchema,
  createRoomSchema,
  drawingStrokeSchema,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema trims a valid playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects a whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow(
      "Player name must include at least one non-space character"
    );
  });

  it("joinRoomSchema trims a valid playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "  Bob  " });

    expect(result.playerName).toBe("Bob");
  });

  it("joinRoomSchema rejects a whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow(
      "Player name must include at least one non-space character"
    );
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema trims and uppercases a valid code", () => {
    const result = roomCodeParamsSchema.parse({ code: " ab12 " });

    expect(result.code).toBe("AB12");
  });

  it("roomCodeParamsSchema rejects whitespace-only codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("roomCodeParamsSchema rejects malformed room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "A!2" })).toThrow();
  });

  it("startRoomSchema requires a participantId", () => {
    expect(() => startRoomSchema.parse({ participantId: "   " })).toThrow(
      "Participant ID is required"
    );
  });

  it("restartRoomSchema requires a participantId", () => {
    expect(() => restartRoomSchema.parse({ participantId: "   " })).toThrow(
      "Participant ID is required"
    );
  });

  it("drawingStrokeSchema accepts normalized drawing points", () => {
    const result = drawingStrokeSchema.parse({
      participantId: "p1",
      points: [
        { x: 0, y: 0 },
        { x: 0.5, y: 0.5 },
        { x: 1, y: 1 }
      ]
    });

    expect(result.points).toHaveLength(3);
  });

  it("drawingStrokeSchema rejects empty point arrays", () => {
    expect(() => drawingStrokeSchema.parse({ participantId: "p1", points: [] })).toThrow(
      "At least one drawing point is required"
    );
  });

  it("drawingStrokeSchema rejects out-of-range points", () => {
    expect(() =>
      drawingStrokeSchema.parse({
        participantId: "p1",
        points: [{ x: -0.1, y: 1.2 }]
      })
    ).toThrow();
  });

  it("clearCanvasSchema requires a participantId", () => {
    expect(() => clearCanvasSchema.parse({ participantId: "   " })).toThrow(
      "Participant ID is required"
    );
  });

  it("submitGuessSchema trims a valid guess", () => {
    const result = submitGuessSchema.parse({
      participantId: "p2",
      guess: "  Rocket  "
    });

    expect(result.guess).toBe("Rocket");
  });

  it("submitGuessSchema rejects a whitespace-only guess", () => {
    expect(() =>
      submitGuessSchema.parse({
        participantId: "p2",
        guess: "   "
      })
    ).toThrow("Guess must include at least one non-space character");
  });
});
