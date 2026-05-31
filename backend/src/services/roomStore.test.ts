import { describe, expect, it } from "vitest";
import {
  appendStroke,
  clearStrokes,
  createRoom,
  joinRoom,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

function startTwoPlayerGame() {
  const host = createRoom("Alice");
  const guest = joinRoom(host.room.code, "Bob");

  if (guest.status !== "joined") {
    throw new Error("Expected guest to join");
  }

  const started = startGame(host.room.code, host.participantId);

  if (started.status !== "started") {
    throw new Error("Expected game to start");
  }

  return { host, guest, started };
}

describe("roomStore", () => {
  it("createRoom returns a room with hostId and trimmed name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("joinRoom returns not_found for unknown code", () => {
    expect(joinRoom("ZZZZ", "Bob")).toEqual({ status: "not_found" });
  });

  it("startGame assigns drawer, word, scores, and empty gameplay arrays", () => {
    const { started, host } = startTwoPlayerGame();

    expect(started.room.status).toBe("playing");
    expect(started.room.drawerId).toBe(host.participantId);
    expect(started.room.secretWord).toBeTruthy();
    expect(started.room.strokes).toEqual([]);
    expect(started.room.guesses).toEqual([]);
    expect(started.room.scores[host.participantId]).toBe(0);
  });

  it("appendStroke allows only the drawer during playing", () => {
    const { host, guest, started } = startTwoPlayerGame();

    const stroke = {
      color: "#111827",
      width: 4,
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 10 }
      ]
    };

    const drawerResult = appendStroke(started.room.code, host.participantId, stroke);
    const guesserResult = appendStroke(started.room.code, guest.participantId, stroke);

    expect(drawerResult.status).toBe("appended");
    if (drawerResult.status === "appended") {
      expect(drawerResult.room.strokes).toHaveLength(1);
    }

    expect(guesserResult.status).toBe("not_drawer");
  });

  it("clearStrokes allows only the drawer", () => {
    const { host, guest, started } = startTwoPlayerGame();

    appendStroke(started.room.code, host.participantId, {
      color: "#111827",
      width: 4,
      points: [{ x: 1, y: 1 }]
    });

    expect(clearStrokes(started.room.code, guest.participantId).status).toBe("not_drawer");

    const cleared = clearStrokes(started.room.code, host.participantId);
    expect(cleared.status).toBe("cleared");
    if (cleared.status === "cleared") {
      expect(cleared.room.strokes).toEqual([]);
    }
  });

  it("submitGuess scores correct guesses and blocks drawer", () => {
    const { host, guest, started } = startTwoPlayerGame();
    const secretWord = started.room.secretWord ?? "";

    const wrong = submitGuess(started.room.code, guest.participantId, "wrong");
    expect(wrong.status).toBe("submitted");
    if (wrong.status === "submitted") {
      expect(wrong.room.scores[guest.participantId]).toBe(0);
      expect(wrong.room.guesses).toHaveLength(1);
    }

    const correct = submitGuess(started.room.code, guest.participantId, secretWord.toUpperCase());
    expect(correct.status).toBe("submitted");
    if (correct.status === "submitted") {
      expect(correct.room.scores[guest.participantId]).toBe(100);
    }

    expect(submitGuess(started.room.code, host.participantId, secretWord).status).toBe("is_drawer");
  });

  it("toRoomSnapshot hides secretWord from guessers", () => {
    const { host, guest, started } = startTwoPlayerGame();

    const drawerSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(started.room, guest.participantId);

    expect(drawerSnapshot.secretWord).toBe(started.room.secretWord);
    expect(guesserSnapshot.secretWord).toBeUndefined();
    expect(drawerSnapshot.strokes).toEqual([]);
    expect(drawerSnapshot.guesses).toEqual([]);
  });
});
