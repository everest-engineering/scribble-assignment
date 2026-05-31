import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, playerNameSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("playerNameSchema trims and rejects empty names", () => {
    expect(() => playerNameSchema.parse("   ")).toThrow();
    expect(playerNameSchema.parse("  Alex  ")).toBe("Alex");
  });

  it("joinRoomSchema rejects blank player names", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });
});
