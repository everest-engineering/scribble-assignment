import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims whitespace and rejects empty names", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
  });

  it("joinRoomSchema trims whitespace and rejects empty names", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
  });

  it("roomCodeParamsSchema normalizes and validates code", () => {
    const result = roomCodeParamsSchema.parse({ code: " abcd " });

    expect(result.code).toBe("ABCD");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });
});
