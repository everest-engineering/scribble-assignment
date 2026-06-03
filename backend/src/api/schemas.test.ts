import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, startRoomSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects an empty playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("createRoomSchema rejects a whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("createRoomSchema trims the playerName", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });

    expect(result.playerName).toBe("Alice");
  });

  it("joinRoomSchema rejects an empty playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("joinRoomSchema rejects a whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("startRoomSchema accepts a valid UUID participantId", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    const result = startRoomSchema.parse({ participantId: id });

    expect(result.participantId).toBe(id);
  });

  it("startRoomSchema rejects a non-UUID participantId", () => {
    expect(() => startRoomSchema.parse({ participantId: "not-a-uuid" })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });
});
