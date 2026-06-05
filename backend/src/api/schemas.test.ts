import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("rejects empty or whitespace-only player names", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: "  " })).toThrow();
  });

  it("trims surrounding whitespace from player names", () => {
    expect(joinRoomSchema.parse({ playerName: "  Bob  " }).playerName).toBe("Bob");
  });

  it("roomCodeParamsSchema rejects an empty code", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
  });
});
