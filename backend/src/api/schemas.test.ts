import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema trims a valid playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects a whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow(
      "Player name must include at least one non-space character"
    );
  });

  it("joinRoomSchema trims a valid playerName", () => {
    const result = joinRoomSchema.parse({ playerName: "  Bob  " });

    expect(result.playerName).toBe("Bob");
  });

  it("joinRoomSchema rejects a whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow(
      "Player name must include at least one non-space character"
    );
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema trims and uppercases a valid code", () => {
    const result = roomCodeParamsSchema.parse({ code: " ab12 " });

    expect(result.code).toBe("AB12");
  });

  it("roomCodeParamsSchema rejects whitespace-only codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("roomCodeParamsSchema rejects malformed room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "A!2" })).toThrow();
  });

  it("startRoomSchema requires a participantId", () => {
    expect(() => startRoomSchema.parse({ participantId: "   " })).toThrow();
  });
});
