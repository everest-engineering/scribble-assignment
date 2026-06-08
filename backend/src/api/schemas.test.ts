import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema, startRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema trims surrounding whitespace, preserving internal spaces (FR-009)", () => {
    expect(createRoomSchema.parse({ playerName: "  Ada  " }).playerName).toBe("Ada");
    expect(createRoomSchema.parse({ playerName: "  Anna Lee  " }).playerName).toBe("Anna Lee");
  });

  it("createRoomSchema reduces a whitespace-only name to empty so the route can reject it (FR-010)", () => {
    expect(createRoomSchema.parse({ playerName: "   " }).playerName).toBe("");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("startRoomSchema accepts a body with participantId", () => {
    const result = startRoomSchema.parse({ participantId: "p1" });

    expect(result.participantId).toBe("p1");
  });

  it("startRoomSchema rejects a body without participantId", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
  });
});
