import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameSchema, submitGuessSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });
    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims whitespace from playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Bob  " });
    expect(result.playerName).toBe("Bob");
  });

  it("createRoomSchema rejects empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("createRoomSchema rejects whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("createRoomSchema accepts missing playerName", () => {
    const result = createRoomSchema.parse({});
    expect(result.playerName).toBeUndefined();
  });

  it("joinRoomSchema trims whitespace from playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "  Charlie  " });
    expect(result.playerName).toBe("Charlie");
  });

  it("startGameSchema requires hostId", () => {
    const result = startGameSchema.parse({ hostId: "abc123" });
    expect(result.hostId).toBe("abc123");
  });

  it("startGameSchema rejects missing hostId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });

  it("submitGuessSchema rejects empty guess", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1", guess: "" })).toThrow();
  });

  it("submitGuessSchema rejects whitespace-only guess", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1", guess: "   " })).toThrow();
  });

  it("submitGuessSchema trims guess", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", guess: "  rocket  " });
    expect(result.guess).toBe("rocket");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });
});
