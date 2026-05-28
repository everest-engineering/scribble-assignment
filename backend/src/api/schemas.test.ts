import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty or whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema accepts valid codes and normalizes them", () => {
    const result = roomCodeParamsSchema.parse({ code: "  abcd  " });
    expect(result.code).toBe("ABCD");
  });

  it("roomCodeParamsSchema rejects invalid formats", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "ABCDE" })).toThrow();
  });
});
