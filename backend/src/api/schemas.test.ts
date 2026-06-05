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

  it("roomCodeParamsSchema rejects an empty code (US3)", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
  });

  it("roomCodeParamsSchema rejects a whitespace-only code (US3)", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("roomCodeParamsSchema trims and accepts a valid code (US3)", () => {
    const result = roomCodeParamsSchema.parse({ code: "  abcd  " });
    expect(result.code).toBe("abcd");
  });
});
