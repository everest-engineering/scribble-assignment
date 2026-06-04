import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema, startGameSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects empty code", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
  });

  it("roomCodeParamsSchema accepts valid code", () => {
    const result = roomCodeParamsSchema.parse({ code: "ABCD" });

    expect(result.code).toBe("ABCD");
  });

  it("startGameSchema rejects missing participantId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });

  it("startGameSchema rejects empty participantId", () => {
    expect(() => startGameSchema.parse({ participantId: "" })).toThrow();
  });

  it("startGameSchema accepts valid participantId", () => {
    const result = startGameSchema.parse({ participantId: "abc-123" });

    expect(result.participantId).toBe("abc-123");
  });
});
