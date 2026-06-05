import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema, startRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  // T012 [US2]
  it("roomCodeParamsSchema trims and uppercases the code", () => {
    const result = roomCodeParamsSchema.parse({ code: "  abcd  " });

    expect(result.code).toBe("ABCD");
  });

  // T012 [US2]
  it("roomCodeParamsSchema rejects empty/whitespace codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
  });

  // T022 [US4]
  it("startRoomSchema rejects missing or empty participantId", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
    expect(() => startRoomSchema.parse({ participantId: "" })).toThrow();
    expect(startRoomSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
  });
});
