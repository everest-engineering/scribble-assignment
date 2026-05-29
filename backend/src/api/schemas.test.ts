import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema trims a valid playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects blank playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema trims a valid playerName", () => {
    const result = joinRoomSchema.parse({ playerName: " Bob " });

    expect(result.playerName).toBe("Bob");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema normalizes room code casing and whitespace", () => {
    const result = roomCodeParamsSchema.parse({ code: " ab12 " });

    expect(result.code).toBe("AB12");
  });

  it("roomCodeParamsSchema rejects malformed room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
  });

  it("startRoomSchema requires participantId", () => {
    expect(() => startRoomSchema.parse({ participantId: "" })).toThrow();
  });

  it("startRoomSchema trims participantId", () => {
    const result = startRoomSchema.parse({ participantId: " participant-1 " });

    expect(result.participantId).toBe("participant-1");
  });
});
