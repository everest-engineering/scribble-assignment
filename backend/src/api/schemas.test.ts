import { describe, expect, it } from "vitest";
import { createRoomSchema, playerNameSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("playerNameSchema trims and rejects empty names", () => {
    expect(() => playerNameSchema.parse("   ")).toThrow();
    expect(playerNameSchema.parse("  Alex  ")).toBe("Alex");
  });

  it("createRoomSchema accepts valid playerName", () => {
    expect(createRoomSchema.parse({ playerName: "Alice" }).playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema normalizes code to uppercase", () => {
    expect(roomCodeParamsSchema.parse({ code: "abcd" }).code).toBe("ABCD");
  });
});
