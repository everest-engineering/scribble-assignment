import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema accepts an empty body (player-name validation belongs to Scenario 2)", () => {
    const result = createRoomSchema.parse({});

    expect(result.playerName).toBeUndefined();
  });

  it("joinRoomSchema accepts an empty body", () => {
    const result = joinRoomSchema.parse({});

    expect(result.playerName).toBeUndefined();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects an empty code with 'Enter a room code'", () => {
    try {
      roomCodeParamsSchema.parse({ code: "" });
      throw new Error("expected schema to throw");
    } catch (error) {
      expect((error as { issues?: Array<{ message: string }> }).issues?.[0]?.message).toBe(
        "Enter a room code"
      );
    }
  });

  it("roomCodeParamsSchema rejects a whitespace-only code with 'Enter a room code'", () => {
    try {
      roomCodeParamsSchema.parse({ code: "   " });
      throw new Error("expected schema to throw");
    } catch (error) {
      expect((error as { issues?: Array<{ message: string }> }).issues?.[0]?.message).toBe(
        "Enter a room code"
      );
    }
  });

  it("roomCodeParamsSchema accepts a valid trimmed code and returns the trimmed value", () => {
    const result = roomCodeParamsSchema.parse({ code: "  abcd  " });

    expect(result.code).toBe("abcd");
  });

  it("startRoomSchema accepts a non-empty participantId", () => {
    const result = startRoomSchema.parse({ participantId: "host-id" });

    expect(result.participantId).toBe("host-id");
  });

  it("startRoomSchema rejects missing or empty participantId", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
    expect(() => startRoomSchema.parse({ participantId: "" })).toThrow();
    expect(() => startRoomSchema.parse({ participantId: 42 })).toThrow();
  });
});
