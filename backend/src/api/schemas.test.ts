import { describe, expect, it } from "vitest";
import {
  createRoomSchema,
  errorResponseSchema,
  roomCodeParamsSchema,
  roomSessionResponseSchema,
  roomSnapshotSchema,
  startGameSchema,
  submitGuessSchema,
  restartRoomSchema
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

  it("restartRoomSchema accepts valid participantId and rejects empty", () => {
    const result = restartRoomSchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
    expect(() => restartRoomSchema.parse({ participantId: " " })).toThrow();
  });

  it("submitGuessSchema accepts valid payload and trims guessText", () => {
    const result = submitGuessSchema.parse({ participantId: "p2", guessText: "   rocket   " });
    expect(result.participantId).toBe("p2");
    expect(result.guessText).toBe("rocket");
  });

  it("submitGuessSchema rejects empty guesses", () => {
    expect(() => submitGuessSchema.parse({ participantId: "p2", guessText: "   " })).toThrow();
  });

  it("validates room snapshot responses containing score, guessHistory, result status, and correctGuesserId", () => {
    const snapshot = {
      code: "ABCD",
      status: "result",
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
      ],
      correctGuesserId: "p2"
    };

    expect(roomSnapshotSchema.parse(snapshot)).toEqual(snapshot);
    expect(roomSessionResponseSchema.parse({ participantId: "p1", room: snapshot }).participantId).toBe("p1");

    // Also verify correctGuesserId can be null or undefined
    const snapshotWithNullWinner = { ...snapshot, status: "lobby", correctGuesserId: null };
    expect(roomSnapshotSchema.parse(snapshotWithNullWinner).correctGuesserId).toBeNull();
  });

  it("validates error responses with DRAWER_CANNOT_GUESS, GAME_NOT_STARTED, RESTART_REQUIRES_HOST, GAME_NOT_IN_RESULT, and GAME_ALREADY_ENDED codes", () => {
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
    const response3 = {
      error: {
        code: "RESTART_REQUIRES_HOST",
        message: "Only the host can restart the game."
      }
    };
    const response4 = {
      error: {
        code: "GAME_NOT_IN_RESULT",
        message: "Game is not in result state."
      }
    };
    const response5 = {
      error: {
        code: "GAME_ALREADY_ENDED",
        message: "Guesses can only be submitted during active gameplay"
      }
    };

    expect(errorResponseSchema.parse(response1)).toEqual(response1);
    expect(errorResponseSchema.parse(response2)).toEqual(response2);
    expect(errorResponseSchema.parse(response3)).toEqual(response3);
    expect(errorResponseSchema.parse(response4)).toEqual(response4);
    expect(errorResponseSchema.parse(response5)).toEqual(response5);
  });
});
