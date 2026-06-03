import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims surrounding whitespace", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects whitespace-only names", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrowError(/required/i);
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema upper-cases and accepts a valid 4-char code", () => {
    expect(roomCodeParamsSchema.parse({ code: "ab2d" }).code).toBe("AB2D");
  });

  it("roomCodeParamsSchema rejects malformed codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ab" })).toThrowError(/valid 4-character/i);
  });
});
