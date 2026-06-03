import { describe, expect, it } from "vitest";
import { HttpError } from "../api/schemas.js";
import { STARTER_WORDS } from "../seed/starterData.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  pickWord,
  restartRound,
  startRound,
  submitGuess,
  toRoomSnapshot,
  updateCanvas
} from "./roomStore.js";

/** Create a host + one guesser and start the round. Returns ids and the word. */
function startedRoom() {
  const host = createRoom("Alice");
  const guesser = joinRoom(host.room.code, "Bob");
  startRound(host.room.code, host.participantId);
  return {
    code: host.room.code,
    hostId: host.participantId,
    guesserId: guesser.participantId,
    word: pickWord(host.room.code)
  };
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and a host", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].score).toBe(0);
    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom throws a 404 for an unknown room code", () => {
    expect(() => joinRoom("ZZZZ", "Bob")).toThrowError(HttpError);
  });

  it("keeps rooms fully isolated", () => {
    const roomA = createRoom("Alice");
    const roomB = createRoom("Carol");

    expect(roomA.room.code).not.toBe(roomB.room.code);

    joinRoom(roomA.room.code, "Bob");

    expect(getRoom(roomA.room.code).participants).toHaveLength(2);
    expect(getRoom(roomB.room.code).participants).toHaveLength(1);
  });

  it("startRound rejects non-hosts, single players, and double starts", () => {
    const host = createRoom("Alice");

    expect(() => startRound(host.room.code, "not-the-host")).toThrowError(/host/i);
    expect(() => startRound(host.room.code, host.participantId)).toThrowError(/2 players/i);

    joinRoom(host.room.code, "Bob");
    const started = startRound(host.room.code, host.participantId);
    expect(started.status).toBe("playing");

    expect(() => startRound(host.room.code, host.participantId)).toThrowError(/already started/i);
  });

  it("pickWord is deterministic and returns a starter word", () => {
    expect(pickWord("ABCD")).toBe(pickWord("ABCD"));
    expect(STARTER_WORDS).toContain(pickWord("WXYZ"));
  });

  it("startRound makes the host the drawer with a secret word", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const room = startRound(host.room.code, host.participantId);

    expect(room.round?.drawerId).toBe(host.participantId);
    expect(room.round?.word).toBe(pickWord(host.room.code));
  });

  it("exposes the word only to the drawer during play", () => {
    const host = createRoom("Alice");
    const bob = joinRoom(host.room.code, "Bob");
    startRound(host.room.code, host.participantId);
    const room = getRoom(host.room.code);

    const drawerView = toRoomSnapshot(room, host.participantId);
    const guesserView = toRoomSnapshot(room, bob.participantId);

    expect(drawerView.word).toBe(pickWord(host.room.code));
    expect(drawerView.viewer?.role).toBe("drawer");
    expect(guesserView.word).toBeNull();
    expect(guesserView.viewer?.role).toBe("guesser");
  });

  it("only the drawer can draw, and clear empties the canvas", () => {
    const game = startedRoom();
    const stroke = { color: "#000", width: 4, points: [{ x: 1, y: 2 }] };

    expect(() => updateCanvas(game.code, game.guesserId, [stroke])).toThrowError(/drawer/i);

    const drawn = updateCanvas(game.code, game.hostId, [stroke]);
    expect(drawn.round?.strokes).toHaveLength(1);

    const cleared = updateCanvas(game.code, game.hostId, []);
    expect(cleared.round?.strokes).toHaveLength(0);
  });

  it("scores a trimmed, case-insensitive correct guess and ends the round", () => {
    const game = startedRoom();

    const wrong = submitGuess(game.code, game.guesserId, "nope");
    expect(wrong.status).toBe("playing");
    expect(wrong.participants.find((p) => p.id === game.guesserId)?.score).toBe(0);

    const right = submitGuess(game.code, game.guesserId, `  ${game.word.toUpperCase()} `);
    expect(right.status).toBe("results");
    expect(right.round?.winnerId).toBe(game.guesserId);
    expect(right.participants.find((p) => p.id === game.guesserId)?.score).toBe(100);
    expect(right.round?.guesses).toHaveLength(2);
  });

  it("rejects the drawer guessing and guesses after the round ends", () => {
    const game = startedRoom();

    expect(() => submitGuess(game.code, game.hostId, game.word)).toThrowError(/drawer cannot/i);

    submitGuess(game.code, game.guesserId, game.word);
    expect(() => submitGuess(game.code, game.guesserId, game.word)).toThrowError(/no active round/i);
  });
});
