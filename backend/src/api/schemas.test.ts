import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });
  it("createRoomSchema rejects invalid playerName", () => {
    const invalidInputs = ["", "   ", "A".repeat(21)];
    for (const input of invalidInputs) {
      expect(() => createRoomSchema.parse({ playerName: input })).toThrow("Player name invalid");
    }
  });
});
