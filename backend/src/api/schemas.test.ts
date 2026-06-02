import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects invalid room code format", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "abc" })).toThrow("Invalid room code format");
  });

  it("roomCodeParamsSchema uppercases valid room codes", () => {
    const result = roomCodeParamsSchema.parse({ code: "ab2d" });

    expect(result.code).toBe("AB2D");
  });
});
