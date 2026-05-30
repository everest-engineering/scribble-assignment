import { describe, expect, it } from "vitest";
import { createRoomSchema, roomCodeParamsSchema, submitGuessSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects an empty playerName after trimming", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required.");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("submitGuessSchema rejects empty guesses after trimming", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p1", text: "   " })).toThrow("Guess is required.");
  });
});
