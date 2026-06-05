import { describe, expect, it } from "vitest";
import {
  clearDrawingSchema,
  createRoomSchema,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  startGameSchema,
  submitGuessSchema,
  updateDrawingSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema trims and accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("joinRoomSchema trims and accepts a valid body with playerName", () => {
    const result = joinRoomSchema.parse({ playerName: " Bob " });

    expect(result.playerName).toBe("Bob");
  });

  it("createRoomSchema and joinRoomSchema reject empty names", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow("Player name is required");
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow("Player name is required");
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow("Player name is required");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema trims and normalizes valid codes", () => {
    const result = roomCodeParamsSchema.parse({ code: " ab12 " });

    expect(result.code).toBe("AB12");
  });

  it("roomCodeParamsSchema rejects empty or malformed codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow("Room code is required");
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow("Room code must be 4 letters or numbers");
  });

  it("startGameSchema requires a participant id", () => {
    expect(startGameSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
    expect(() => startGameSchema.parse({ participantId: " " })).toThrow("Participant id is required");
  });

  it("updateDrawingSchema requires participant id and drawing payload", () => {
    const result = updateDrawingSchema.parse({
      participantId: "p1",
      drawing: { strokes: [{ points: [{ x: 1, y: 2 }] }] }
    });

    expect(result.drawing.strokes[0].points[0]).toEqual({ x: 1, y: 2 });
    expect(() => updateDrawingSchema.parse({ participantId: " ", drawing: { strokes: [] } })).toThrow(
      "Participant id is required"
    );
    expect(() => updateDrawingSchema.parse({ participantId: "p1" })).toThrow();
  });

  it("clearDrawingSchema requires a participant id", () => {
    expect(clearDrawingSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
    expect(() => clearDrawingSchema.parse({ participantId: " " })).toThrow("Participant id is required");
  });

  it("restartGameSchema requires a participant id", () => {
    expect(restartGameSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
    expect(() => restartGameSchema.parse({ participantId: " " })).toThrow("Participant id is required");
  });

  it("submitGuessSchema trims and rejects empty guesses", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", guessText: " Rocket " });

    expect(result.guessText).toBe("Rocket");
    expect(() => submitGuessSchema.parse({ participantId: "p1", guessText: " " })).toThrow("Guess is required");
  });
});
