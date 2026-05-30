import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  errorResponseSchema,
  roomCodeParamsSchema,
  roomSessionResponseSchema,
  roomSnapshotSchema,
  startGameSchema
} from "./schemas.js";

describe("schemas", () => {
  it("createRoomSchema accepts a valid body with playerName", () => {
    const result = createRoomSchema.parse({ playerName: "Alice" });

    expect(result.playerName).toBe("Alice");
  });

  it("roomCodeParamsSchema rejects missing code", () => {
    expect(() => roomCodeParamsSchema.parse({})).toThrow();
  });

  it("roomCodeParamsSchema rejects whitespace room codes", () => {
    expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow();
  });

  it("roomCodeParamsSchema normalizes room codes", () => {
    const result = roomCodeParamsSchema.parse({ code: " abcd " });

    expect(result.code).toBe("ABCD");
  });

  it("startGameSchema rejects missing participant ids", () => {
    expect(() => startGameSchema.parse({ participantId: " " })).toThrow();
  });

  it("validates room snapshot responses", () => {
    const snapshot = {
      code: "ABCD",
      status: "lobby",
      hostParticipantId: "p1",
      participants: [{ id: "p1", name: "Alice", joinedAt: "2026-05-30T00:00:00.000Z" }],
      availableWords: ["rocket"],
      roles: ["drawer", "guesser"]
    };

    expect(roomSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(roomSessionResponseSchema.parse({ participantId: "p1", room: snapshot }).participantId).toBe("p1");
  });

  it("validates error responses", () => {
    const response = {
      error: {
        code: "ROOM_CODE_REQUIRED",
        message: "Room code is required."
      }
    };

    expect(errorResponseSchema.parse(response)).toEqual(response);
  });
});
