import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("createRoomSchema rejects empty/whitespace playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow("Username cannot be empty or only whitespace.");
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Username cannot be empty or only whitespace.");
  });
});
