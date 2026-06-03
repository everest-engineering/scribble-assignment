import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims surrounding whitespace from playerName", () => {
    expect(createRoomSchema.parse({ playerName: "  Alice  " }).playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty or whitespace-only names", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema accepts a valid 4-character code", () => {
    expect(roomCodeParamsSchema.parse({ code: "WTR7" }).code).toBe("WTR7");
  });

  it("roomCodeParamsSchema rejects malformed codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "ABCDE" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "AB!2" })).toThrow();
  });
});
