import { describe, expect, it } from "vitest";
import {
  addStroke,
  clearCanvas,
  createRoom,
  joinRoom,
  normalizePlayerName,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

function startTwoPlayerGame() {
  const host = createRoom("Host");
  expect(host.ok).toBe(true);
  if (!host.ok) {
    throw new Error("Failed to create host room");
  }

  const guest = joinRoom(host.room.code, "Guest");
  expect(guest.ok).toBe(true);
  if (!guest.ok) {
    throw new Error("Failed to join guest");
  }

  const started = startRoom(host.room.code, host.participantId);
  expect(started.ok).toBe(true);
  if (!started.ok) {
    throw new Error("Failed to start game");
  }

  return { host, guest, started };
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostParticipantId to the creator", () => {
    const result = createRoom("Alice");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("normalizePlayerName trims surrounding whitespace", () => {
    expect(normalizePlayerName("  Alex  ")).toEqual({ ok: true, name: "Alex" });
  });

  it("normalizePlayerName rejects empty and whitespace-only names", () => {
    expect(normalizePlayerName("")).toEqual({ ok: false, reason: "empty_name" });
    expect(normalizePlayerName("   ")).toEqual({ ok: false, reason: "empty_name" });
  });

  it("createRoom rejects empty names", () => {
    expect(createRoom("   ")).toEqual({ ok: false, reason: "empty_name" });
  });

  it("createRoom stores trimmed names", () => {
    const result = createRoom("  Sam  ");

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.participants[0].name).toBe("Sam");
  });

  it("joinRoom returns not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ ok: false, reason: "not_found" });
  });

  it("joinRoom rejects empty names", () => {
    const host = createRoom("Host");

    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    expect(joinRoom(host.room.code, "   ")).toEqual({ ok: false, reason: "empty_name" });
  });

  it("startRoom rejects non-host participant", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    const guest = joinRoom(host.room.code, "Guest");

    expect(guest.ok).toBe(true);
    if (!guest.ok) {
      return;
    }

    const result = startRoom(host.room.code, guest.participantId);

    expect(result).toEqual({ ok: false, reason: "not_host" });
  });

  it("startRoom rejects when fewer than two players", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    const result = startRoom(host.room.code, host.participantId);

    expect(result).toEqual({ ok: false, reason: "not_enough_players" });
  });

  it("startRoom succeeds for host with two players", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    joinRoom(host.room.code, "Guest");

    const result = startRoom(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.status).toBe("playing");
    }
  });

  it("startRoom sets drawerParticipantId to host and secretWord to rocket", () => {
    const host = createRoom("Host");
    expect(host.ok).toBe(true);
    if (!host.ok) {
      return;
    }

    joinRoom(host.room.code, "Guest");

    const result = startRoom(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.room.drawerParticipantId).toBe(host.participantId);
      expect(result.room.secretWord).toBe("rocket");
    }
  });

  it("startRoom initializes gameplay fields and zero scores", () => {
    const { started } = startTwoPlayerGame();

    expect(started.room.strokes).toEqual([]);
    expect(started.room.guesses).toEqual([]);
    expect(started.room.scoredParticipantIds).toEqual([]);
    expect(started.room.participants.every((participant) => participant.score === 0)).toBe(true);
  });

  it("toRoomSnapshot includes secretWord only for drawer viewer", () => {
    const { host, guest, started } = startTwoPlayerGame();

    const drawerSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(started.room, guest.participantId);

    expect(drawerSnapshot.secretWord).toBe("rocket");
    expect(guesserSnapshot.secretWord).toBeUndefined();
    expect(drawerSnapshot.participants.find((p) => p.id === host.participantId)?.role).toBe(
      "drawer"
    );
    expect(guesserSnapshot.participants.find((p) => p.id === guest.participantId)?.role).toBe(
      "guesser"
    );
  });

  it("addStroke appends stroke for drawer only", () => {
    const { host, guest, started } = startTwoPlayerGame();

    const stroke = {
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ]
    };

    const drawerResult = addStroke(started.room.code, host.participantId, stroke);
    expect(drawerResult.ok).toBe(true);
    if (drawerResult.ok) {
      expect(drawerResult.room.strokes).toHaveLength(1);
    }

    const guesserResult = addStroke(started.room.code, guest.participantId, stroke);
    expect(guesserResult).toEqual({ ok: false, reason: "not_drawer" });
  });

  it("clearCanvas removes strokes for drawer only", () => {
    const { host, guest, started } = startTwoPlayerGame();

    addStroke(started.room.code, host.participantId, {
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ]
    });

    const clearResult = clearCanvas(started.room.code, host.participantId);
    expect(clearResult.ok).toBe(true);
    if (clearResult.ok) {
      expect(clearResult.room.strokes).toEqual([]);
    }

    addStroke(started.room.code, host.participantId, {
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 20 }
      ]
    });

    const guesserClear = clearCanvas(started.room.code, guest.participantId);
    expect(guesserClear).toEqual({ ok: false, reason: "not_drawer" });
  });

  it("submitGuess rejects empty guesses and drawer submissions", () => {
    const { host, guest, started } = startTwoPlayerGame();

    expect(submitGuess(started.room.code, guest.participantId, "   ")).toEqual({
      ok: false,
      reason: "empty_guess"
    });

    expect(submitGuess(started.room.code, host.participantId, "rocket")).toEqual({
      ok: false,
      reason: "is_drawer"
    });
  });

  it("submitGuess appends trimmed guesses to snapshot history", () => {
    const { host, guest, started } = startTwoPlayerGame();

    const result = submitGuess(started.room.code, guest.participantId, "  pizza  ");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.guesses).toHaveLength(1);
    expect(result.room.guesses[0].text).toBe("pizza");
    expect(result.room.guesses[0].isCorrect).toBe(false);

    const snapshot = toRoomSnapshot(result.room, host.participantId);
    expect(snapshot.guesses).toHaveLength(1);
    expect(snapshot.guesses?.[0].participantName).toBe("Guest");
  });

  it("submitGuess awards +100 for first correct guess only", () => {
    const { host, guest, started } = startTwoPlayerGame();

    const incorrect = submitGuess(started.room.code, guest.participantId, "pizza");
    expect(incorrect.ok).toBe(true);
    if (!incorrect.ok) {
      return;
    }

    const guestAfterIncorrect = incorrect.room.participants.find(
      (participant) => participant.id === guest.participantId
    );
    expect(guestAfterIncorrect?.score).toBe(0);

    const correct = submitGuess(incorrect.room.code, guest.participantId, "Rocket");
    expect(correct.ok).toBe(true);
    if (!correct.ok) {
      return;
    }

    const guestAfterCorrect = correct.room.participants.find(
      (participant) => participant.id === guest.participantId
    );
    expect(guestAfterCorrect?.score).toBe(100);

    const repeatCorrect = submitGuess(correct.room.code, guest.participantId, "rocket");
    expect(repeatCorrect.ok).toBe(true);
    if (!repeatCorrect.ok) {
      return;
    }

    const guestAfterRepeat = repeatCorrect.room.participants.find(
      (participant) => participant.id === guest.participantId
    );
    expect(guestAfterRepeat?.score).toBe(100);
    expect(repeatCorrect.room.guesses).toHaveLength(3);
  });
});
