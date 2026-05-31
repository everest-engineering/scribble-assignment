import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

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

  it("createRoomSchema rejects missing playerName", () => {
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  it("joinRoomSchema accepts a valid body with playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "Bob" });
    expect(result.playerName).toBe("Bob");
  });

  it("joinRoomSchema rejects empty playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("startGameSchema accepts a valid participantId", () => {
    const result = startGameSchema.parse({ participantId: "abc-123" });
    expect(result.participantId).toBe("abc-123");
  });

  it("startGameSchema rejects missing participantId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });
});