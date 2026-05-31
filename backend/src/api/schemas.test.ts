import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("createRoomSchema rejects whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("startGameSchema requires participantId", () => {
    const result = startGameSchema.parse({ participantId: "abc" });
    expect(result.participantId).toBe("abc");
  });

  it("startGameSchema rejects empty participantId", () => {
    expect(() => startGameSchema.parse({ participantId: "" })).toThrow();
  });
});
