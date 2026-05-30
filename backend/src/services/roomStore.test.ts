import { beforeEach, describe, expect, it } from "vitest";
import {
  addStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  resetRoomsForTests,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

function startTwoPlayerGame() {
  const host = createRoom("Alice");
  const guest = joinRoom(host.room.code, "Bob");

  if ("error" in guest) {
    throw new Error("Expected guest join to succeed");
  }

  const started = startGame(host.room.code, host.participantId);

  if ("error" in started) {
    throw new Error("Expected start to succeed");
  }

  return { host, guest, started };
}

describe("roomStore", () => {
  beforeEach(() => {
    resetRoomsForTests();
  });
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns the creator as host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);

    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(snapshot.isHost).toBe(true);
    expect(snapshot.canStart).toBe(false);
    expect(snapshot.participants[0].isHost).toBe(true);
  });

  it("joinRoom returns not_found for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toEqual({ error: "not_found" });
  });

  it("joinRoom adds a participant to an existing lobby", () => {
    const host = createRoom("Alice");
    const result = joinRoom(host.room.code, "Bob");

    expect("error" in result).toBe(false);

    if ("error" in result) {
      return;
    }

    expect(result.room.participants).toHaveLength(2);
    expect(result.room.hostId).toBe(host.participantId);
  });

  it("joinRoom is case-insensitive via uppercase room codes", () => {
    const host = createRoom("Alice");
    const lowerCode = host.room.code.toLowerCase();
    const result = joinRoom(lowerCode, "Bob");

    expect("error" in result).toBe(false);
  });

  it("joinRoom rejects rooms that are no longer in lobby status", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const result = joinRoom(host.room.code, "Charlie");

    expect(result).toEqual({ error: "not_lobby" });
  });

  it("rooms remain isolated from each other", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Bob");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    const joinA = joinRoom(roomA.room.code, "Carol");

    expect("error" in joinA).toBe(false);

    if ("error" in joinA) {
      return;
    }

    expect(joinA.room.participants.every((participant) => participant.name !== "Bob")).toBe(true);
  });

  it("startGame rejects when fewer than two players are present", () => {
    const host = createRoom("Alice");
    const result = startGame(host.room.code, host.participantId);

    expect(result).toEqual({ error: "not_enough_players" });
  });

  it("startGame rejects non-host participants", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if ("error" in guest) {
      throw new Error("Expected guest join to succeed");
    }

    const result = startGame(host.room.code, guest.participantId);

    expect(result).toEqual({ error: "not_host" });
  });

  it("startGame transitions the room to playing for the host", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect("error" in result).toBe(false);

    if ("error" in result) {
      return;
    }

    expect(result.room.status).toBe("playing");
  });

  it("startGame assigns the host as the sole drawer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if ("error" in guest) {
      throw new Error("Expected guest join to succeed");
    }

    const result = startGame(host.room.code, host.participantId);

    if ("error" in result) {
      throw new Error("Expected start to succeed");
    }

    expect(result.room.drawerId).toBe(host.participantId);

    const hostSnapshot = toRoomSnapshot(result.room, host.participantId);
    const guestSnapshot = toRoomSnapshot(result.room, guest.participantId);

    expect(hostSnapshot.drawerId).toBe(host.participantId);
    expect(hostSnapshot.participants.filter((entry) => entry.role === "drawer")).toHaveLength(1);
    expect(hostSnapshot.participants.filter((entry) => entry.role === "guesser")).toHaveLength(1);
    expect(guestSnapshot.drawerId).toBe(host.participantId);
  });

  it("startGame selects a deterministic starter-list word", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    if ("error" in result) {
      throw new Error("Expected start to succeed");
    }

    expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(result.room.secretWord);

    const secondStart = startGame(host.room.code, host.participantId);

    expect(secondStart).toEqual({ error: "not_lobby" });
    expect(getRoom(host.room.code)?.secretWord).toBe(result.room.secretWord);
  });

  it("toRoomSnapshot hides the secret word from guessers", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    if ("error" in guest) {
      throw new Error("Expected guest join to succeed");
    }

    const started = startGame(host.room.code, host.participantId);

    if ("error" in started) {
      throw new Error("Expected start to succeed");
    }

    const drawerSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(started.room, guest.participantId);

    expect(drawerSnapshot.viewerRole).toBe("drawer");
    expect(drawerSnapshot.secretWord).toBe(started.room.secretWord);
    expect(guesserSnapshot.viewerRole).toBe("guesser");
    expect(guesserSnapshot.secretWord).toBeNull();
  });

  it("startGame initializes all participant scores to zero", () => {
    const { started, host, guest } = startTwoPlayerGame();
    const snapshot = toRoomSnapshot(started.room, host.participantId);

    expect(started.room.scores?.[host.participantId]).toBe(0);
    expect(started.room.scores?.[guest.participantId]).toBe(0);
    expect(snapshot.participants.every((participant) => participant.score === 0)).toBe(true);
  });

  it("addStroke appends a stroke for the drawer only", () => {
    const { host, guest, started } = startTwoPlayerGame();
    const stroke = { id: "s1", points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }] };

    const drawerResult = addStroke(started.room.code, host.participantId, stroke);
    const guesserResult = addStroke(started.room.code, guest.participantId, stroke);

    expect("error" in drawerResult).toBe(false);
    expect(guesserResult).toEqual({ error: "not_drawer" });

    if ("error" in drawerResult) {
      return;
    }

    expect(drawerResult.room.strokes).toHaveLength(1);
  });

  it("clearCanvas removes all strokes for the drawer", () => {
    const { host, started } = startTwoPlayerGame();
    addStroke(started.room.code, host.participantId, {
      id: "s1",
      points: [{ x: 0.1, y: 0.2 }]
    });

    const cleared = clearCanvas(started.room.code, host.participantId);

    if ("error" in cleared) {
      throw new Error("Expected clear to succeed");
    }

    expect(cleared.room.strokes).toEqual([]);
  });

  it("submitGuess rejects drawer submissions", () => {
    const { host, started } = startTwoPlayerGame();
    const result = submitGuess(started.room.code, host.participantId, "rocket");

    expect(result).toEqual({ error: "is_drawer" });
  });

  it("submitGuess scores case-insensitive matches and records history", () => {
    const { guest, started } = startTwoPlayerGame();
    const word = started.room.secretWord ?? "rocket";
    const result = submitGuess(started.room.code, guest.participantId, word.toUpperCase());

    if ("error" in result) {
      throw new Error("Expected guess to succeed");
    }

    expect(result.room.guesses).toHaveLength(1);
    expect(result.room.guesses?.[0].isCorrect).toBe(true);
    expect(result.room.scores?.[guest.participantId]).toBe(100);

    const snapshot = toRoomSnapshot(result.room, guest.participantId);
    expect(snapshot.guesses).toHaveLength(1);
    expect(snapshot.participants.find((entry) => entry.id === guest.participantId)?.score).toBe(100);
  });

  it("submitGuess adds zero points for incorrect guesses", () => {
    const { guest, started } = startTwoPlayerGame();
    const result = submitGuess(started.room.code, guest.participantId, "definitely-wrong");

    if ("error" in result) {
      throw new Error("Expected guess to succeed");
    }

    expect(result.room.scores?.[guest.participantId]).toBe(0);
    expect(result.room.guesses?.[0].isCorrect).toBe(false);
  });

  it("submitGuess transitions to results on the first correct guess", () => {
    const { guest, started } = startTwoPlayerGame();
    const word = started.room.secretWord ?? "rocket";
    const result = submitGuess(started.room.code, guest.participantId, word);

    if ("error" in result) {
      throw new Error("Expected guess to succeed");
    }

    expect(result.room.status).toBe("results");
  });

  it("submitGuess rejects guesses after the round ends", () => {
    const { guest, started } = startTwoPlayerGame();
    const word = started.room.secretWord ?? "rocket";

    submitGuess(started.room.code, guest.participantId, word);
    const second = submitGuess(started.room.code, guest.participantId, "another-guess");

    expect(second).toEqual({ error: "not_playing" });
  });

  it("addStroke and clearCanvas reject mutations after results", () => {
    const { host, guest, started } = startTwoPlayerGame();
    const word = started.room.secretWord ?? "rocket";

    submitGuess(started.room.code, guest.participantId, word);

    const stroke = { id: "s1", points: [{ x: 0.1, y: 0.2 }] };
    const strokeResult = addStroke(started.room.code, host.participantId, stroke);
    const clearResult = clearCanvas(started.room.code, host.participantId);

    expect(strokeResult).toEqual({ error: "not_playing" });
    expect(clearResult).toEqual({ error: "not_playing" });
  });

  it("toRoomSnapshot reveals the secret word to all viewers in results", () => {
    const { host, guest, started } = startTwoPlayerGame();
    const word = started.room.secretWord ?? "rocket";
    const ended = submitGuess(started.room.code, guest.participantId, word);

    if ("error" in ended) {
      throw new Error("Expected guess to succeed");
    }

    const guesserSnapshot = toRoomSnapshot(ended.room, guest.participantId);

    expect(guesserSnapshot.status).toBe("results");
    expect(guesserSnapshot.secretWord).toBe(word);
    expect(guesserSnapshot.guesses).toHaveLength(1);
    expect(guesserSnapshot.participants.every((entry) => entry.score !== undefined)).toBe(true);
  });

  it("restartGame returns lobby with round fields cleared for the host", () => {
    const { host, guest, started } = startTwoPlayerGame();
    const word = started.room.secretWord ?? "rocket";

    submitGuess(started.room.code, guest.participantId, word);
    const restarted = restartGame(started.room.code, host.participantId);

    if ("error" in restarted) {
      throw new Error("Expected restart to succeed");
    }

    expect(restarted.room.status).toBe("lobby");
    expect(restarted.room.participants).toHaveLength(2);
    expect(restarted.room.drawerId).toBeUndefined();
    expect(restarted.room.secretWord).toBeUndefined();
    expect(restarted.room.scores).toBeUndefined();
    expect(restarted.room.strokes).toBeUndefined();
    expect(restarted.room.guesses).toBeUndefined();
  });

  it("restartGame rejects non-host participants", () => {
    const { host, guest, started } = startTwoPlayerGame();
    const word = started.room.secretWord ?? "rocket";

    submitGuess(started.room.code, guest.participantId, word);
    const result = restartGame(started.room.code, guest.participantId);

    expect(result).toEqual({ error: "not_host" });
  });

  it("restartGame rejects when the room is still playing", () => {
    const { host, started } = startTwoPlayerGame();
    const result = restartGame(started.room.code, host.participantId);

    expect(result).toEqual({ error: "not_results" });
  });
});
