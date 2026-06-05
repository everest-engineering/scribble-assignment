import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  drawingSchema,
  endRoomSchema,
  guessSchema,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("create/join schemas reject empty and whitespace-only names and trim valid ones (US4)", () => {
    for (const schema of [createRoomSchema, joinRoomSchema]) {
      expect(() => schema.parse({ playerName: "" })).toThrow();
      expect(() => schema.parse({ playerName: "   " })).toThrow();
      expect(() => schema.parse({})).toThrow();
      expect(schema.parse({ playerName: "  Bob  " }).playerName).toBe("Bob");
    }
  });

  it("startRoomSchema requires a participantId (US1)", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
    expect(startRoomSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
  });

  it("guessSchema requires participantId and a non-empty trimmed text (Scenario 3 US1)", () => {
    expect(() => guessSchema.parse({ participantId: "p1", text: "" })).toThrow();
    expect(() => guessSchema.parse({ participantId: "p1", text: "   " })).toThrow();
    expect(() => guessSchema.parse({ text: "pizza" })).toThrow();
    expect(guessSchema.parse({ participantId: "p1", text: "  pizza  " }).text).toBe("pizza");
  });

  it("drawingSchema requires participantId and accepts a string or null (Scenario 3 US4)", () => {
    expect(() => drawingSchema.parse({ drawing: "data:..." })).toThrow();
    expect(drawingSchema.parse({ participantId: "p1", drawing: "data:image/png" }).drawing).toBe(
      "data:image/png"
    );
    expect(drawingSchema.parse({ participantId: "p1", drawing: null }).drawing).toBeNull();
  });

  it("end/restart schemas require a participantId (Scenario 4)", () => {
    expect(() => endRoomSchema.parse({})).toThrow();
    expect(() => restartRoomSchema.parse({})).toThrow();
    expect(endRoomSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
    expect(restartRoomSchema.parse({ participantId: "p1" }).participantId).toBe("p1");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects an empty code (US3)", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
  });

  it("roomCodeParamsSchema rejects a whitespace-only code (US3)", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("roomCodeParamsSchema trims and accepts a valid code (US3)", () => {
    const result = roomCodeParamsSchema.parse({ code: "  abcd  " });
    expect(result.code).toBe("abcd");
  });
});
