import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startGameQuerySchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("joinRoomSchema rejects empty playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("joinRoomSchema rejects whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema accepts a valid non-empty playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "Bob" });

    expect(result.playerName).toBe("Bob");
  });

  it("startGameQuerySchema rejects missing participantId", () => {
    expect(() => startGameQuerySchema.parse({})).toThrow();
  });

  it("startGameQuerySchema accepts a valid participantId", () => {
    const result = startGameQuerySchema.parse({ participantId: "uuid-string" });

    expect(result.participantId).toBe("uuid-string");
  });
});
