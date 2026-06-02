import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  joinRoomSchema,
  roomCodeParamsSchema,
  startRoomRequestSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  // T010: createRoomSchema rejects empty/whitespace playerName
  it("createRoomSchema rejects empty playerName", () => {
    expect(createRoomSchema.safeParse({ playerName: "" }).success).toBe(false);
  });

  it("createRoomSchema rejects whitespace-only playerName", () => {
    expect(createRoomSchema.safeParse({ playerName: "   " }).success).toBe(false);
  });

  it("createRoomSchema accepts a valid playerName", () => {
    expect(createRoomSchema.safeParse({ playerName: "Alice" }).success).toBe(true);
  });

  // T019: joinRoomSchema rejects empty/whitespace playerName
  it("joinRoomSchema rejects empty playerName", () => {
    expect(joinRoomSchema.safeParse({ playerName: "" }).success).toBe(false);
  });

  it("joinRoomSchema rejects whitespace-only playerName", () => {
    expect(joinRoomSchema.safeParse({ playerName: "  " }).success).toBe(false);
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  // T028: startRoomRequestSchema validates participantId
  it("startRoomRequestSchema rejects empty participantId", () => {
    expect(startRoomRequestSchema.safeParse({ participantId: "" }).success).toBe(false);
  });

  it("startRoomRequestSchema accepts a valid participantId", () => {
    expect(startRoomRequestSchema.safeParse({ participantId: "some-uuid" }).success).toBe(true);
  });
});
