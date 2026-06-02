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

  it("createRoomSchema trims surrounding whitespace on playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects an empty playerName with 'Enter your name'", () => {
    try {
      createRoomSchema.parse({ playerName: "" });
      throw new Error("expected schema to throw");
    } catch (error) {
      expect(
        (error as { issues?: Array<{ message: string }> }).issues?.[0]?.message
      ).toBe("Enter your name");
    }
  });

  it("createRoomSchema rejects a whitespace-only playerName with 'Enter your name'", () => {
    try {
      createRoomSchema.parse({ playerName: "   " });
      throw new Error("expected schema to throw");
    } catch (error) {
      expect(
        (error as { issues?: Array<{ message: string }> }).issues?.[0]?.message
      ).toBe("Enter your name");
    }
  });

  it("createRoomSchema rejects a missing playerName", () => {
    expect(() => createRoomSchema.parse({})).toThrow();
  });

  it("joinRoomSchema rejects an empty or whitespace-only playerName with 'Enter your name'", () => {
    try {
      joinRoomSchema.parse({ playerName: "  " });
      throw new Error("expected schema to throw");
    } catch (error) {
      expect(
        (error as { issues?: Array<{ message: string }> }).issues?.[0]?.message
      ).toBe("Enter your name");
    }
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
