import { describe, expect, it } from "vitest";
import {
  addStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

// Helper: create a room, add a guesser, and start the game. Returns ids + word.
function startedRoom() {
  const host = createRoom("Alice");
  const guest = joinRoom(host.room.code, "Bob")!;
  startGame(host.room.code, host.participantId);
  const word = STARTER_WORDS[getRoom(host.room.code)!.wordIndex];
  return { code: host.room.code, hostId: host.participantId, guestId: guest.participantId, word };
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom makes the creator the host", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.hostId).toBe(result.room.participants[0].id);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("keeps rooms fully isolated from one another", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    const joined = joinRoom(roomA.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.participants.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    // Bob never appears in room B, and room B's host is unchanged.
    expect(roomB.room.participants).toHaveLength(1);
    expect(roomB.room.hostId).toBe(roomB.participantId);
  });

  it("selects words deterministically in creation order (no randomness)", () => {
    // Two rooms created back-to-back advance the word index by exactly one.
    const first = createRoom("Alice");
    const second = createRoom("Carol");

    const firstWord = STARTER_WORDS[first.room.wordIndex];
    const expectedSecond = STARTER_WORDS[(first.room.wordIndex + 1) % STARTER_WORDS.length];

    expect(firstWord).toBe(STARTER_WORDS[first.room.wordIndex]);
    expect(STARTER_WORDS[second.room.wordIndex]).toBe(expectedSecond);
  });

  it("reveals the word only to the drawer while playing", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();

    const started = startGame(host.room.code, host.participantId);
    expect("room" in started).toBe(true);

    const room = getRoom(host.room.code)!;
    const drawerView = toRoomSnapshot(room, host.participantId);
    const guesserView = toRoomSnapshot(room, guest!.participantId);

    expect(room.status).toBe("playing");
    expect(room.drawerId).toBe(host.participantId);
    expect(drawerView.word).toBe(STARTER_WORDS[room.wordIndex]);
    expect(guesserView.word).toBeUndefined();
  });

  it("startGame rejects a non-host requester", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob")!;

    const result = startGame(host.room.code, guest.participantId);

    expect(result).toEqual({ error: "not-host" });
  });

  it("startGame rejects a room with fewer than 2 players", () => {
    const host = createRoom("Alice");

    const result = startGame(host.room.code, host.participantId);

    expect(result).toEqual({ error: "not-enough-players" });
  });

  it("starts every participant with a score of 0", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob")!;

    const room = getRoom(host.room.code)!;

    expect(room.scores[host.participantId]).toBe(0);
    expect(room.scores[guest.participantId]).toBe(0);
  });

  it("scores a correct guess 100, case-insensitively and trimmed", () => {
    const game = startedRoom();

    const result = submitGuess(game.code, game.guestId, `  ${game.word.toUpperCase()} `);

    expect("room" in result && result.correct).toBe(true);
    const room = getRoom(game.code)!;
    expect(room.scores[game.guestId]).toBe(100);
    expect(room.guesses.at(-1)?.correct).toBe(true);
  });

  it("does not award more than 100 for repeated correct guesses", () => {
    const game = startedRoom();

    submitGuess(game.code, game.guestId, game.word);
    submitGuess(game.code, game.guestId, game.word);

    expect(getRoom(game.code)!.scores[game.guestId]).toBe(100);
  });

  it("records an incorrect guess with 0 points", () => {
    const game = startedRoom();

    const result = submitGuess(game.code, game.guestId, "definitely-wrong");

    expect("room" in result && result.correct).toBe(false);
    const room = getRoom(game.code)!;
    expect(room.scores[game.guestId]).toBe(0);
    expect(room.guesses.at(-1)?.correct).toBe(false);
  });

  it("rejects empty guesses and the drawer guessing", () => {
    const game = startedRoom();

    expect(submitGuess(game.code, game.guestId, "   ")).toEqual({ error: "empty" });
    expect(submitGuess(game.code, game.hostId, game.word)).toEqual({ error: "is-drawer" });
  });

  it("lets only the drawer add and clear strokes", () => {
    const game = startedRoom();
    const stroke = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 }
    ];

    expect(addStroke(game.code, game.guestId, stroke)).toEqual({ error: "not-drawer" });

    const added = addStroke(game.code, game.hostId, stroke);
    expect("room" in added).toBe(true);
    expect(getRoom(game.code)!.strokes).toHaveLength(1);

    expect(clearCanvas(game.code, game.guestId)).toEqual({ error: "not-drawer" });
    clearCanvas(game.code, game.hostId);
    expect(getRoom(game.code)!.strokes).toHaveLength(0);
  });

  it("ends the round on the first correct guess and reveals the word to all", () => {
    const game = startedRoom();

    submitGuess(game.code, game.guestId, game.word);

    const room = getRoom(game.code)!;
    expect(room.status).toBe("finished");
    // Once finished, the word is public to every viewer (including a guesser).
    expect(toRoomSnapshot(room, game.guestId).word).toBe(game.word);
  });

  it("rejects a guess submitted to a finished room", () => {
    const game = startedRoom();
    submitGuess(game.code, game.guestId, game.word);

    const result = submitGuess(game.code, game.guestId, game.word);

    expect(result).toEqual({ error: "finished" });
  });

  it("restart clears round state, resets scores, and preserves players", () => {
    const game = startedRoom();
    addStroke(game.code, game.hostId, [{ x: 0.1, y: 0.1 }]);
    submitGuess(game.code, game.guestId, game.word);

    const before = getRoom(game.code)!;
    const wordBefore = before.wordIndex;

    const result = restartGame(game.code, game.hostId);
    expect("room" in result).toBe(true);

    const after = getRoom(game.code)!;
    expect(after.status).toBe("lobby");
    expect(after.strokes).toHaveLength(0);
    expect(after.guesses).toHaveLength(0);
    expect(after.drawerId).toBeUndefined();
    expect(after.scores[game.guestId]).toBe(0);
    expect(after.scores[game.hostId]).toBe(0);
    // Players preserved.
    expect(after.participants.map((p) => p.id)).toEqual(before.participants.map((p) => p.id));
    // Word advanced deterministically for the next round.
    expect(after.wordIndex).toBe((wordBefore + 1) % STARTER_WORDS.length);
  });

  it("restart rejects a non-host requester", () => {
    const game = startedRoom();

    const result = restartGame(game.code, game.guestId);

    expect(result).toEqual({ error: "not-host" });
  });
});
