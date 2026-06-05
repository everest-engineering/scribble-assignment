import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("create/join schemas reject empty and whitespace-only names and trim valid ones (US4)", () => {
    for (const schema of [createRoomSchema, joinRoomSchema]) {
      expect(() => schema.parse({ playerName: "" })).toThrow();
      expect(() => schema.parse({ playerName: "   " })).toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(schema.parse({ playerName: "  Bob  " }).playerName).toBe("Bob");
    }
  });

  it("startRoomSchema requires a participantId (US1)", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
    expect(startRoomSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
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
