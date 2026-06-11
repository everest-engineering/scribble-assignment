import { describe, expect, it } from "vitest";
import { addStroke, clearCanvas, createRoom, getRoom, joinRoom, restartGame, revealRound, saveRoom, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participantId", () => {
    const result = createRoom("Host");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("toRoomSnapshot includes hostId", () => {
    const result = createRoom("Player");
    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(snapshot.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom adds participant to room", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined!.room.participants).toHaveLength(2);
    expect(joined!.room.participants[0].name).toBe("Alice");
    expect(joined!.room.participants[1].name).toBe("Bob");
  });

  it("joinRoom preserves hostId from creator", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    expect(joined!.room.hostId).toBe(created.participantId);
  });

  it("getRoom returns null for unknown code", () => {
    const room = getRoom("ZZZZ");

    expect(room).toBeNull();
  });

  it("getRoom returns cloned room for existing code", () => {
    const created = createRoom("Alice");
    const room = getRoom(created.room.code);

    expect(room).not.toBeNull();
    expect(room!.code).toBe(created.room.code);
  });

  it("joinRoom returns null when room is in playing status", () => {
    const created = createRoom("Alice");
    const room = getRoom(created.room.code);
    if (room) {
      room.status = "playing";
      saveRoom(room);
    }

    const joined = joinRoom(created.room.code, "Bob");

    expect(joined).toBeNull();
  });

  it("startGame transitions room to playing status", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const result = startGame(created.room.code, created.participantId);

    expect(result).not.toBeNull();
    expect(result!.room.status).toBe("playing");
  });

  it("startGame rejects non-host participantId", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const nonHostId = "some-random-uuid";
    const result = startGame(created.room.code, nonHostId);

    expect(result).toBeNull();
  });

  it("startGame rejects when fewer than 2 participants", () => {
    const created = createRoom("Alice");
    const result = startGame(created.room.code, created.participantId);

    expect(result).toBeNull();
  });

  it("startGame returns null for unknown room code", () => {
    const result = startGame("ZZZZ", "some-id");

    expect(result).toBeNull();
  });

  it("startGame creates first round with host as drawer", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    const result = startGame(code, created.participantId);

    expect(result).not.toBeNull();
    const room = getRoom(code);
    expect(room?.rounds).toHaveLength(1);
    expect(room?.rounds[0].roundNumber).toBe(1);
    expect(room?.rounds[0].drawerId).toBe(created.participantId);
    expect(room?.rounds[0].secretWord).toBeDefined();
  });

  it("toRoomSnapshot returns drawerId visible to all participants", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const snapshotHost = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshotHost.drawerId).toBe(created.participantId);
    expect(snapshotHost.drawerId).not.toBeNull();
  });

  it("toRoomSnapshot returns yourRole correctly per participant", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const snapshotHost = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshotHost.yourRole).toBe("drawer");

    const snapshotGuesser = toRoomSnapshot(getRoom(code)!, joined!.participantId);
    expect(snapshotGuesser.yourRole).toBe("guesser");
  });

  it("wordForDrawer present for drawer, absent for guessers", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const snapshotHost = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshotHost.wordForDrawer).toBeDefined();
    expect(snapshotHost.wordForDrawer!.length).toBeGreaterThan(0);

    const snapshotGuesser = toRoomSnapshot(getRoom(code)!, joined!.participantId);
    expect(snapshotGuesser.wordForDrawer).toBeUndefined();
  });

  it("wordLength equals secretWord.length", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    const snapshot = toRoomSnapshot(room, created.participantId);

    expect(snapshot.wordLength).toBe(room.rounds[0].secretWord.length);
  });

  it("addStroke appends a Stroke to round.strokes", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const points = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
    const result = addStroke(code, created.participantId, points);

    expect(result).toEqual({ ok: true });
    const room = getRoom(code)!;
    expect(room.rounds[0].strokes).toHaveLength(1);
    expect(room.rounds[0].strokes[0].points).toEqual(points);
  });

  it("addStroke returns 403 for non-drawer", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = addStroke(code, joined!.participantId, [{ x: 0, y: 0 }]);

    expect(result).toEqual({ ok: false, status: 403, message: "Only the drawer can submit strokes" });
  });

  it("clearCanvas empties round.strokes", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    addStroke(code, created.participantId, [{ x: 10, y: 20 }]);
    const result = clearCanvas(code, created.participantId);

    expect(result).toEqual({ ok: true });
    const room = getRoom(code)!;
    expect(room.rounds[0].strokes).toHaveLength(0);
  });

  it("clearCanvas returns 403 for non-drawer", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    addStroke(code, created.participantId, [{ x: 10, y: 20 }]);
    const result = clearCanvas(code, joined!.participantId);

    expect(result).toEqual({ ok: false, status: 403, message: "Only the drawer can clear the canvas" });
  });

  it("toRoomSnapshot includes strokes for all participants", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    addStroke(code, created.participantId, [{ x: 10, y: 20 }]);

    const snapshotDrawer = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshotDrawer.strokes).toHaveLength(1);
    expect(snapshotDrawer.strokes[0].points).toEqual([{ x: 10, y: 20 }]);

    const snapshotGuesser = toRoomSnapshot(getRoom(code)!, joined!.participantId);
    expect(snapshotGuesser.strokes).toHaveLength(1);
    expect(snapshotGuesser.strokes[0].points).toEqual([{ x: 10, y: 20 }]);
  });

  it("submitGuess trims whitespace and compares case-insensitively", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    const secretWord = room.rounds[0].secretWord;

    const result = submitGuess(code, joined!.participantId, `  ${secretWord.toUpperCase()}  `);
    expect(result).toEqual({ result: "correct", message: "Correct! You scored 100 points." });
  });

  it("submitGuess returns incorrect for wrong guess", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = submitGuess(code, joined!.participantId, "wrongword");
    expect(result).toEqual({ result: "incorrect", message: "Incorrect guess. Try again!" });
  });

  it("submitGuess rejects empty guesses", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = submitGuess(code, joined!.participantId, "");
    expect(result).toEqual({ error: "Guess cannot be empty" });
  });

  it("submitGuess rejects whitespace-only guesses", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = submitGuess(code, joined!.participantId, "   ");
    expect(result).toEqual({ error: "Guess cannot be empty" });
  });

  it("submitGuess returns already_correct for previously correct guesser", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined1 = joinRoom(code, "Bob");
    const joined2 = joinRoom(code, "Charlie");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    const secretWord = room.rounds[0].secretWord;

    submitGuess(code, joined1!.participantId, secretWord);
    const result = submitGuess(code, joined1!.participantId, secretWord);
    expect(result).toEqual({ result: "already_correct", message: "Already guessed correctly" });
  });

  it("submitGuess returns 403 for drawer trying to guess", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = submitGuess(code, created.participantId, "anything");
    expect(result).toEqual({ error: "Only guessers can submit guesses" });
  });

  it("toRoomSnapshot includes guesses array and scores map", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    const secretWord = room.rounds[0].secretWord;

    submitGuess(code, joined!.participantId, secretWord);

    const snapshot = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshot.guesses).toHaveLength(1);
    expect(snapshot.guesses[0].participantId).toBe(joined!.participantId);
    expect(snapshot.guesses[0].result).toBe("correct");
    expect(snapshot.scores).toEqual({ [joined!.participantId]: 100 });
  });

  it("scores computed as correct guess count x 100 per participant", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined1 = joinRoom(code, "Bob");
    const joined2 = joinRoom(code, "Charlie");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    const secretWord = room.rounds[0].secretWord;

    submitGuess(code, joined1!.participantId, "wrong");
    submitGuess(code, joined1!.participantId, secretWord);
    submitGuess(code, joined2!.participantId, secretWord);

    const snapshot = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshot.scores[joined1!.participantId]).toBe(100);
    expect(snapshot.scores[joined2!.participantId]).toBe(100);
    expect(Object.keys(snapshot.scores)).toHaveLength(2);
  });

  it("incorrect guess does not change score", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    submitGuess(code, joined!.participantId, "wrong");

    const snapshot = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshot.scores[joined!.participantId]).toBeUndefined();
  });

  it("revealRound transitions room to result status", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = revealRound(code, created.participantId);
    expect(result).not.toBeNull();
    expect(result!.room.status).toBe("result");
  });

  it("revealRound returns null for non-host", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const result = revealRound(code, joined!.participantId);
    expect(result).toBeNull();
  });

  it("revealRound returns null if room not playing", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");

    const result = revealRound(code, created.participantId);
    expect(result).toBeNull();
  });

  it("room stays playing after all correct guesses — result only on host reveal", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined1 = joinRoom(code, "Bob");
    const joined2 = joinRoom(code, "Charlie");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    const secretWord = room.rounds[0].secretWord;

    submitGuess(code, joined1!.participantId, secretWord);
    expect(getRoom(code)!.status).toBe("playing");

    submitGuess(code, joined2!.participantId, secretWord);
    expect(getRoom(code)!.status).toBe("playing");

    revealRound(code, created.participantId);
    expect(getRoom(code)!.status).toBe("result");
  });

  it("result snapshot includes correct word, scores, and guess history", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined1 = joinRoom(code, "Bob");
    const joined2 = joinRoom(code, "Charlie");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    const secretWord = room.rounds[0].secretWord;

    submitGuess(code, joined1!.participantId, "wrong");
    submitGuess(code, joined2!.participantId, secretWord);
    revealRound(code, created.participantId);

    const snapshot = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshot.status).toBe("result");
    expect(snapshot.wordLength).toBe(secretWord.length);
    expect(snapshot.guesses.length).toBeGreaterThan(0);
    expect(snapshot.scores[joined2!.participantId]).toBe(100);
  });

  it("restartGame clears all round data and sets status to lobby", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    room.status = "result";
    saveRoom(room);

    const result = restartGame(code, created.participantId);
    expect(result).not.toBeNull();
    expect(result!.room.status).toBe("lobby");
    expect(result!.room.rounds).toHaveLength(0);

    const snapshot = toRoomSnapshot(getRoom(code)!, created.participantId);
    expect(snapshot.drawerId).toBeNull();

    const stored = getRoom(code);
    expect(stored!.rounds).toHaveLength(0);
  });

  it("restartGame preserves participants", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    room.status = "result";
    saveRoom(room);

    const before = getRoom(code)!.participants.length;
    const result = restartGame(code, created.participantId);
    expect(result!.room.participants).toHaveLength(before);
    expect(result!.room.participants[0].name).toBe("Alice");
  });

  it("restartGame returns null for non-host", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    const joined = joinRoom(code, "Bob");
    startGame(code, created.participantId);

    const room = getRoom(code)!;
    room.status = "result";
    saveRoom(room);

    const result = restartGame(code, joined!.participantId);
    expect(result).toBeNull();
  });

  it("restartGame returns null if room not in result status", () => {
    const created = createRoom("Alice");
    const code = created.room.code;
    joinRoom(code, "Bob");

    const result = restartGame(code, created.participantId);
    expect(result).toBeNull();
  });
});
