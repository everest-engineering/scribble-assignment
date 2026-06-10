import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName and trims it", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });
    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty or whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow(/Player name cannot be empty/);
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow(/Player name cannot be empty/);
    expect(() => createRoomSchema.parse({})).toThrow(/Player name is required/);
  });

  it("roomCodeParamsSchema rejects missing or empty code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow(/Room code is required/);
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow(/Room code cannot be empty/);
  });
});
