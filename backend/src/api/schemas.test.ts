import { describe, expect, it } from "vitest";
import {
  appendStrokeSchema,
  clearStrokesSchema,
  createRoomSchema,
  joinRoomSchema,
  playerNameSchema,
  roomCodeParamsSchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("playerNameSchema trims whitespace", () => {
    const result = playerNameSchema.parse("  Bob  ");

    expect(result).toBe("Bob");
  });

  it("playerNameSchema rejects empty name", () => {
    expect(() => playerNameSchema.parse("   ")).toThrow("Player name is required");
  });

  it("playerNameSchema rejects names longer than 24 characters", () => {
    expect(() => playerNameSchema.parse("a".repeat(25))).toThrow(
      "Player name must be 24 characters or fewer"
    );
  });

  it("joinRoomSchema rejects missing playerName", () => {
    expect(() => joinRoomSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("startRoomSchema accepts participantId", () => {
    const result = startRoomSchema.parse({ participantId: "uuid-1" });

    expect(result.participantId).toBe("uuid-1");
  });

  it("startRoomSchema rejects empty participantId", () => {
    expect(() => startRoomSchema.parse({ participantId: "" })).toThrow();
  });

  it("appendStrokeSchema accepts valid stroke body", () => {
    const result = appendStrokeSchema.parse({
      participantId: "p1",
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ]
    });

    expect(result.participantId).toBe("p1");
    expect(result.points).toHaveLength(2);
  });

  it("appendStrokeSchema rejects too few points", () => {
    expect(() =>
      appendStrokeSchema.parse({
        participantId: "p1",
        points: [{ x: 1, y: 2 }]
      })
    ).toThrow();
  });

  it("clearStrokesSchema accepts participantId", () => {
    const result = clearStrokesSchema.parse({ participantId: "p1" });

    expect(result.participantId).toBe("p1");
  });

  it("submitGuessSchema accepts text", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", text: "rocket" });

    expect(result.text).toBe("rocket");
  });
});
