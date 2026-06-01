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

  it("createRoomSchema trims whitespace from playerName and rejects whitespace-only names", () => {
    const trimmed = createRoomSchema.parse({ playerName: "  Bob  " });
    expect(trimmed.playerName).toBe("Bob");

    // whitespace-only name should throw a ZodError with the validation message
    try {
      createRoomSchema.parse({ playerName: "   " });
      throw new Error("Expected parse to throw for whitespace-only name");
    } catch (err: any) {
      // Zod throws an Error-like object; ensure it includes the validation message
      const msg = err?.errors?.[0]?.message ?? err?.message;
      expect(String(msg)).toContain("Please enter a name");
    }
  });
});
