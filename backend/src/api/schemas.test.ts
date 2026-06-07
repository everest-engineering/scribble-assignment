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

  it("startRoomSchema accepts a body with participantId", () => {
    const result = startRoomSchema.parse({ participantId: "p1" });

    expect(result.participantId).toBe("p1");
  });

  it("startRoomSchema rejects a body without participantId", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
  });
});
