import { describe, expect, it } from "vitest";
import {
  clearCanvasSchema,
  createRoomSchema,
  drawingSubmissionSchema,
  guessSubmissionSchema,
  joinRoomSchema,
  leaveRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema
} from "./schemas.js";

describe("schemas", () => {
  it("rejects empty and whitespace-only room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow();
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("rejects invalid room codes and normalizes valid codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "abc" })).toThrow();
    expect(roomCodeParamsSchema.parse({ code: "abcd" })).toEqual({ code: "ABCD" });
  });

  it("trims player names and rejects whitespace-only values", () => {
    expect(createRoomSchema.parse({ playerName: "  Alice  " })).toEqual({
      playerName: "Alice"
    });
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("requires a participant id for start and leave actions", () => {
    expect(() => startRoomSchema.parse({})).toThrow();
    expect(() => leaveRoomSchema.parse({ participantId: "" })).toThrow();
  });

  it("validates drawing and guess payloads", () => {
    expect(
      drawingSubmissionSchema.parse({
        participantId: "participant-1",
        points: [{ x: 10, y: 20 }]
      })
    ).toEqual({
      participantId: "participant-1",
      points: [{ x: 10, y: 20 }]
    });
    expect(() => clearCanvasSchema.parse({ participantId: " " })).toThrow();
    expect(guessSubmissionSchema.parse({ participantId: "p1", guess: "  Rocket  " })).toEqual({
      participantId: "p1",
      guess: "Rocket"
    });
  });
});
