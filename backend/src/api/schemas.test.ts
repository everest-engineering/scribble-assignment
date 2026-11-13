import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema, drawingSchema, guessSchema } from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName and trims it", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice   " });
    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects empty or whitespace-only playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema rejects empty or whitespace-only playerName", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("createRoomSchema and joinRoomSchema reject playerName longer than 32 characters", () => {
    const longName = "a".repeat(33);
    expect(() => createRoomSchema.parse({ playerName: longName })).toThrow();
    expect(() => joinRoomSchema.parse({ playerName: longName })).toThrow();
  });

  it("roomCodeParamsSchema rejects invalid characters, lowercase, or incorrect lengths", () => {
    expect(roomCodeParamsSchema.parse({ code: "abcd" })).toEqual({ code: "ABCD" }); // auto-uppercase
    expect(roomCodeParamsSchema.parse({ code: "A1B2" })).toEqual({ code: "A1B2" });
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "ABCDE" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "AB-C" })).toThrow();
  });

  it("drawingSchema accepts valid string drawing data", () => {
    const result = drawingSchema.parse({ drawingData: "data:image/png;base64,123" });
    expect(result.drawingData).toBe("data:image/png;base64,123");
  });

  it("guessSchema accepts valid participantId and guessText, and trims guessText", () => {
    const participantId = "a2928810-72ee-4d37-9759-3fb70729c158";
    const result = guessSchema.parse({ participantId, guessText: "   rocket   " });
    expect(result.participantId).toBe(participantId);
    expect(result.guessText).toBe("rocket");
  });

  it("guessSchema rejects empty or whitespace-only guessText", () => {
    const participantId = "a2928810-72ee-4d37-9759-3fb70729c158";
    expect(() => guessSchema.parse({ participantId, guessText: "" })).toThrow();
    expect(() => guessSchema.parse({ participantId, guessText: "    " })).toThrow();
  });
});
