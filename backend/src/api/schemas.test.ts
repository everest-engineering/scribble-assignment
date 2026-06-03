import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, playerNameSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("playerNameSchema trims whitespace", () => {
    const result = playerNameSchema.parse("  Bob  ");

    expect(result).toBe("Bob");
  });

  it("playerNameSchema rejects empty name", () => {
    expect(() => playerNameSchema.parse("   ")).toThrow("Player name is required");
  });

  it("playerNameSchema rejects names longer than 24 characters", () => {
    expect(() => playerNameSchema.parse("a".repeat(25))).toThrow(
      "Player name must be 24 characters or fewer"
    );
  });

  it("joinRoomSchema rejects missing playerName", () => {
    expect(() => joinRoomSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });
});
