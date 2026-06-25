import { describe, expect, it } from "vitest";
import { createRoomSchema, guessSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty player names", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects malformed room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "A" })).toThrow(
      "Room code must be 4 letters or numbers"
    );
  });

  it("guessSchema trims valid guesses", () => {
    const result = guessSchema.parse({ participantId: "p1", guess: " Rocket " });

    expect(result.guess).toBe("Rocket");
  });
});
