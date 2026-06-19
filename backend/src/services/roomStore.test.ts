import { describe, expect, it } from "vitest";
import {
  createRoom,
  endRound,
  joinRoom,
  listWords,
  restartGame,
  selectWord,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

function expectHttpStatus(fn: () => unknown, statusCode: number) {
  try {
    fn();
  } catch (error) {
    expect((error as { statusCode?: number }).statusCode).toBe(statusCode);
    return;
  }

  throw new Error(`expected an error with status ${statusCode}, but none was thrown`);
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom records the creator as host and starts in lobby", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.status).toBe("lobby");

    const snapshot = toRoomSnapshot(result.room);
    expect(snapshot.hostId).toBe(result.participantId);
    expect(snapshot.status).toBe("lobby");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom adds a participant to an existing room", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.participants).toHaveLength(2);
    expect(joined?.room.participants[1].name).toBe("Bob");
    expect(joined?.participantId).toBeDefined();
  });

  it("startGame rejects a non-host with 403", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");

    expectHttpStatus(() => startGame(created.room.code, "intruder-id"), 403);
  });

  it("startGame rejects fewer than 2 players with 409", () => {
    const created = createRoom("Alice");

    expectHttpStatus(() => startGame(created.room.code, created.participantId), 409);
  });

  it("startGame activates the room for the host with 2+ players", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");

    const result = startGame(created.room.code, created.participantId);

    expect(result.room.status).toBe("active");
  });

  it("createRoom rejects a blank or whitespace-only name with 400", () => {
    expectHttpStatus(() => createRoom("   "), 400);
    expectHttpStatus(() => createRoom(undefined), 400);
  });

  it("createRoom trims the player name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("joinRoom rejects a blank name with 400", () => {
    const created = createRoom("Alice");

    expectHttpStatus(() => joinRoom(created.room.code, "   "), 400);
  });

  it("startGame assigns the host as drawer and snapshot reports role per viewer", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result.room.drawerId).toBe(result.room.hostId);

    const drawerView = toRoomSnapshot(result.room, created.participantId);
    const guesserView = toRoomSnapshot(result.room, joined?.participantId);

    expect(drawerView.drawerId).toBe(result.room.hostId);
    expect(drawerView.role).toBe("drawer");
    expect(guesserView.role).toBe("guesser");
    expect(guesserView.drawerId).toBe(result.room.hostId);
  });

  it("selectWord is deterministic and returns a starter word", () => {
    const words = listWords();

    expect(words).toContain(selectWord("ABCD"));
    expect(selectWord("ABCD")).toBe(selectWord("ABCD"));
  });

  it("startGame sets a secret word from the starter list", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");

    const result = startGame(created.room.code, created.participantId);

    expect(listWords()).toContain(result.room.secretWord);
    expect(result.room.secretWord).toBe(selectWord(result.room.code));
  });

  it("exposes the secret word only to the drawer", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    const drawerView = toRoomSnapshot(result.room, created.participantId);
    const guesserView = toRoomSnapshot(result.room, joined?.participantId);

    expect(drawerView.word).toBe(result.room.secretWord);
    // The guesser snapshot carries no `word` field, so it never reveals which word is secret.
    // (The public `availableWords` list still contains all candidates by design.)
    expect(guesserView.word).toBeUndefined();
    expect(Object.values(guesserView).includes(result.room.secretWord as string)).toBe(false);
  });

  it("submitGuess validates input and records correctness", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);
    const word = result.room.secretWord as string;
    const guesserId = joined?.participantId as string;

    // empty/whitespace rejected
    expectHttpStatus(() => submitGuess(created.room.code, guesserId, "   "), 400);
    // the drawer cannot guess
    expectHttpStatus(() => submitGuess(created.room.code, created.participantId, "anything"), 403);

    // a wrong guess is recorded as incorrect
    const wrong = submitGuess(created.room.code, guesserId, "definitely-not-the-word");
    expect(wrong.room.guesses.at(-1)?.correct).toBe(false);

    // a correct guess (different case + surrounding spaces) is recorded as correct
    const right = submitGuess(created.room.code, guesserId, `  ${word.toUpperCase()} `);
    expect(right.room.guesses.at(-1)?.correct).toBe(true);
    expect(right.room.guesses.at(-1)?.text).toBe(word.toUpperCase());
  });

  it("includes the shared guess history in every viewer's snapshot", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    const after = submitGuess(created.room.code, joined?.participantId as string, "pizza");

    const drawerView = toRoomSnapshot(after.room, created.participantId);
    const guesserView = toRoomSnapshot(after.room, joined?.participantId);

    expect(drawerView.guesses).toHaveLength(1);
    expect(drawerView.guesses[0].text).toBe("pizza");
    expect(guesserView.guesses).toEqual(drawerView.guesses);
  });

  it("awards 100 once for a correct guess and blocks repeats", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const started = startGame(created.room.code, created.participantId);
    const word = started.room.secretWord as string;
    const guesserId = joined?.participantId as string;

    const findScore = (room: { participants: { id: string; score: number }[] }) =>
      room.participants.find((participant) => participant.id === guesserId)?.score;

    // incorrect → score stays 0
    const wrong = submitGuess(created.room.code, guesserId, "not-the-word");
    expect(findScore(wrong.room)).toBe(0);

    // correct → 100
    const right = submitGuess(created.room.code, guesserId, word);
    expect(findScore(right.room)).toBe(100);

    // repeat after correct → 409, score unchanged
    expectHttpStatus(() => submitGuess(created.room.code, guesserId, word), 409);
  });

  it("endRound is host-only, requires an active round, and reveals the word to all", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const started = startGame(created.room.code, created.participantId);
    const guesserId = joined?.participantId as string;

    // during the active round, a guesser cannot see the word
    expect(toRoomSnapshot(started.room, guesserId).word).toBeUndefined();

    // a non-host cannot end the round
    expectHttpStatus(() => endRound(created.room.code, guesserId), 403);

    // the host ends the round → result, and the word is revealed to everyone
    const ended = endRound(created.room.code, created.participantId);
    expect(ended.room.status).toBe("result");
    expect(toRoomSnapshot(ended.room, guesserId).word).toBe(ended.room.secretWord);

    // ending again is refused (no longer an active round)
    expectHttpStatus(() => endRound(created.room.code, created.participantId), 409);
  });

  it("restartGame is host-only and resets round state while preserving players", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const started = startGame(created.room.code, created.participantId);
    const guesserId = joined?.participantId as string;
    // a correct guess scores 100 and now auto-ends the round to the result state (increment 005)
    const ended = submitGuess(created.room.code, guesserId, started.room.secretWord as string);
    expect(ended.room.status).toBe("result");

    // a non-host cannot restart
    expectHttpStatus(() => restartGame(created.room.code, guesserId), 403);

    // the host restarts → clean lobby, players preserved
    const restarted = restartGame(created.room.code, created.participantId);
    expect(restarted.room.status).toBe("lobby");
    expect(restarted.room.drawerId).toBeUndefined();
    expect(restarted.room.secretWord).toBeUndefined();
    expect(restarted.room.guesses).toHaveLength(0);
    expect(restarted.room.participants).toHaveLength(2);
    expect(restarted.room.participants.every((participant) => participant.score === 0)).toBe(true);
  });

  it("auto-ends the round on a correct guess and refuses guesses once ended", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    const started = startGame(created.room.code, created.participantId);
    const guesserId = joined?.participantId as string;
    const word = started.room.secretWord as string;

    // an incorrect guess keeps the round active
    const wrong = submitGuess(created.room.code, guesserId, "not-the-word");
    expect(wrong.room.status).toBe("active");

    // a correct guess scores and moves the whole room to the result state, word revealed to all
    const right = submitGuess(created.room.code, guesserId, word);
    expect(right.room.status).toBe("result");
    expect(toRoomSnapshot(right.room, guesserId).word).toBe(word);

    // once the round has ended, further guesses are refused (round not active)
    expectHttpStatus(() => submitGuess(created.room.code, guesserId, word), 409);
  });
});
