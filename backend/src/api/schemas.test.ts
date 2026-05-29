import { describe, expect, it } from "vitest";
import {
  clearDrawingSchema,
  createRoomSchema,
  drawingSchema,
  endRoundSchema,
  guessSchema,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  startRoomSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema trims a valid playerName", () => {
    const result = createRoomSchema.parse({ playerName: " Alice " });

    expect(result.playerName).toBe("Alice");
  });

  it("createRoomSchema rejects blank playerName", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema trims a valid playerName", () => {
    const result = joinRoomSchema.parse({ playerName: " Bob " });

    expect(result.playerName).toBe("Bob");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema normalizes room code casing and whitespace", () => {
    const result = roomCodeParamsSchema.parse({ code: " ab12 " });

    expect(result.code).toBe("AB12");
  });

  it("roomCodeParamsSchema rejects malformed room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "ABC" })).toThrow();
  });

  it("startRoomSchema requires participantId", () => {
    expect(() => startRoomSchema.parse({ participantId: "" })).toThrow();
  });

  it("startRoomSchema trims participantId", () => {
    const result = startRoomSchema.parse({ participantId: " participant-1 " });

    expect(result.participantId).toBe("participant-1");
  });

  it("drawingSchema accepts bounded stroke payloads", () => {
    const result = drawingSchema.parse({
      participantId: " drawer-1 ",
      stroke: {
        color: "#111827",
        size: 4,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 }
        ]
      }
    });

    expect(result.participantId).toBe("drawer-1");
    expect(result.stroke.points).toHaveLength(2);
  });

  it("drawingSchema rejects malformed strokes", () => {
    expect(() =>
      drawingSchema.parse({
        participantId: "drawer-1",
        stroke: {
          color: "black",
          size: 0,
          points: [{ x: 0.5, y: 0.5 }]
        }
      })
    ).toThrow();
  });

  it("clearDrawingSchema trims participantId", () => {
    const result = clearDrawingSchema.parse({ participantId: " drawer-1 " });

    expect(result.participantId).toBe("drawer-1");
  });

  it("guessSchema trims guesses and rejects empty guesses", () => {
    const result = guessSchema.parse({ participantId: "guesser-1", guess: " Rocket " });

    expect(result.guess).toBe("Rocket");
    expect(() => guessSchema.parse({ participantId: "guesser-1", guess: "   " })).toThrow();
  });

  it("endRoundSchema trims participantId", () => {
    const result = endRoundSchema.parse({ participantId: " host-1 " });

    expect(result.participantId).toBe("host-1");
  });

  it("restartRoomSchema requires participantId", () => {
    expect(() => restartRoomSchema.parse({ participantId: "" })).toThrow();
  });
});
