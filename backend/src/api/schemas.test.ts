import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  startGameSchema
} from "./schemas.js";

describe("createRoomSchema", () => {
  it("accepts a valid player name", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });
    expect(result.playerName).toBe("Alice");
  });

  it("trims whitespace from player name", () => {
    const result = createRoomSchema.parse({ playerName: "  Bob  " });
    expect(result.playerName).toBe("Bob");
  });

  it("rejects empty player name after trimming", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });
});

describe("joinRoomSchema", () => {
  it("accepts a valid player name", () => {
    const result = joinRoomSchema.parse({ playerName: "Charlie" });
    expect(result.playerName).toBe("Charlie");
  });

  it("trims whitespace from player name", () => {
    const result = joinRoomSchema.parse({ playerName: "  Dave  " });
    expect(result.playerName).toBe("Dave");
  });

  it("rejects empty player name", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });
});

describe("roomCodeParamsSchema", () => {
  it("accepts a valid 4-character code", () => {
    const result = roomCodeParamsSchema.parse({ code: "ABCD" });
    expect(result.code).toBe("ABCD");
  });

  it("rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("rejects code shorter than 4 characters", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "AB" })).toThrow();
  });

  it("rejects code longer than 4 characters", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABCDE" })).toThrow();
  });
});

describe("startGameSchema", () => {
  it("accepts a valid participantId", () => {
    const result = startGameSchema.parse({ participantId: "some-uuid" });
    expect(result.participantId).toBe("some-uuid");
  });

  it("rejects missing participantId", () => {
    expect(() => startGameSchema.parse({})).toThrow();
  });
});
