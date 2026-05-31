import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  errorResponseSchema,
  roomCodeParamsSchema,
  roomSessionResponseSchema,
  roomSnapshotSchema,
  startGameSchema,
  submitGuessSchema
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

  it("submitGuessSchema accepts valid payload and trims guessText", () => {
    const result = submitGuessSchema.parse({ participantId: "p2", guessText: "   rocket   " });
    expect(result.participantId).toBe("p2");
    expect(result.guessText).toBe("rocket");
  });

  it("submitGuessSchema rejects empty guesses", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p2", guessText: "   " })).toThrow();
  });

  it("validates room snapshot responses containing score and guessHistory", () => {
    const snapshot = {
      code: "ABCD",
      status: "lobby",
      hostParticipantId: "p1",
      participants: [{ id: "p1", name: "Alice", joinedAt: "2026-05-30T00:00:00.000Z", score: 100 }],
      availableWords: ["rocket"],
      roles: ["drawer", "guesser"],
      roundState: {
        drawerId: "p1",
        secretWord: "rocket"
      },
      guessHistory: [
        {
          id: "g1",
          participantId: "p2",
          playerName: "Bob",
          guessText: "rocket",
          isCorrect: true,
          createdAt: "2026-05-30T00:01:00.000Z"
        }
      ]
    };

    expect(roomSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(roomSessionResponseSchema.parse({ participantId: "p1", room: snapshot }).participantId).toBe("p1");
  });

  it("validates error responses with DRAWER_CANNOT_GUESS and GAME_NOT_STARTED codes", () => {
    const response1 = {
      error: {
        code: "DRAWER_CANNOT_GUESS",
        message: "The drawer is not permitted to submit guesses"
      }
    };
    const response2 = {
      error: {
        code: "GAME_NOT_STARTED",
        message: "Guesses can only be submitted when the game is in progress"
      }
    };

    expect(errorResponseSchema.parse(response1)).toEqual(response1);
    expect(errorResponseSchema.parse(response2)).toEqual(response2);
  });
});
