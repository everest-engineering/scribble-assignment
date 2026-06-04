import { describe, expect, it } from "vitest";
import { clearDrawing, createRoom, getRoom, joinRoom, restartGame, startGame, submitDrawStroke, submitGuess, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame fails with less than 2 players", () => {
    const { room, participantId } = createRoom("Alice");
    const result = startGame(room.code, participantId);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(400);
    }
  });

  it("startGame fails for non-host player", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob")!;
    const result = startGame(host.room.code, guest.participantId);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(403);
    }
  });

  it("startGame succeeds with 2 players and assigns drawer", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    const result = startGame(host.room.code, host.participantId);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.room.status).toBe("playing");
      expect(result.room.drawerId).toBe(host.participantId);
      expect(result.room.secretWord).toBeTruthy();
    }
  });

  it("submitGuess returns error for non-existent room", () => {
    const result = submitGuess("ZZZZ", "p1", "rocket");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(404);
    }
  });

  it("correct guess ends round and awards 100 points", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const room = getRoom(host.room.code)!;

    const bobResult = room.participants.find((p) => p.name === "Bob")!;
    const guesserId = bobResult.id;
    const secretWord = room.secretWord!;
    const result = submitGuess(host.room.code, guesserId, secretWord);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.room.status).toBe("finished");
      expect(result.room.scores[guesserId]).toBe(100);
    }
  });

  it("incorrect guess adds 0 score and does not end round", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const room = getRoom(host.room.code)!;

    const bobResult = room.participants.find((p) => p.name === "Bob")!;
    const guesserId = bobResult.id;
    const result = submitGuess(host.room.code, guesserId, "wrongguess");

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.room.status).toBe("playing");
      expect(result.room.scores[guesserId]).toBe(0);
      expect(result.room.guesses).toHaveLength(1);
      expect(result.room.guesses[0].isCorrect).toBe(false);
    }
  });

  it("submitGuess rejects drawer's guess", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const result = submitGuess(host.room.code, host.participantId, "rocket");
    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(400);
    }
  });

  it("restartGame resets round state but preserves participants", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const result = restartGame(host.room.code, host.participantId);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.room.status).toBe("lobby");
      expect(result.room.drawerId).toBeNull();
      expect(result.room.secretWord).toBeNull();
      expect(result.room.guesses).toHaveLength(0);
      expect(result.room.scores).toEqual({});
      expect(result.room.participants).toHaveLength(2);
    }
  });

  it("restartGame fails for non-host", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants.find((p) => p.name === "Bob")!.id;
    const result = restartGame(host.room.code, bobId);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(403);
    }
  });

  it("submitDrawStroke appends a stroke to the room", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const stroke = [{ x: 10, y: 20 }, { x: 30, y: 40 }];
    const result = submitDrawStroke(host.room.code, host.participantId, stroke);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.room.drawStrokes).toHaveLength(1);
      expect(result.room.drawStrokes[0]).toEqual(stroke);
    }
  });

  it("submitDrawStroke rejects non-drawer", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants.find((p) => p.name === "Bob")!.id;
    const result = submitDrawStroke(host.room.code, bobId, [{ x: 0, y: 0 }]);

    expect("error" in result).toBe(true);
    if ("error" in result) {
      expect(result.status).toBe(403);
    }
  });

  it("clearDrawing clears all strokes", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    submitDrawStroke(host.room.code, host.participantId, [{ x: 10, y: 20 }]);
    const result = clearDrawing(host.room.code, host.participantId);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.room.drawStrokes).toHaveLength(0);
    }
  });

  it("restartGame clears drawStrokes", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    submitDrawStroke(host.room.code, host.participantId, [{ x: 10, y: 20 }]);
    const result = restartGame(host.room.code, host.participantId);

    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.room.drawStrokes).toHaveLength(0);
    }
  });

  it("toRoomSnapshot includes drawStrokes in snapshot", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    submitDrawStroke(host.room.code, host.participantId, [{ x: 1, y: 2 }]);
    const room = getRoom(host.room.code)!;
    const snapshot = toRoomSnapshot(room, host.participantId);

    expect(snapshot.drawStrokes).toHaveLength(1);
    expect(snapshot.drawStrokes[0][0]).toEqual({ x: 1, y: 2 });
  });

  it("toRoomSnapshot shows secretWord for drawer only", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const room = getRoom(host.room.code)!;
    const bobId = room.participants.find((p) => p.name === "Bob")!.id;

    const drawerView = toRoomSnapshot(room, host.participantId);
    const guesserView = toRoomSnapshot(room, bobId);

    expect(drawerView.secretWord).toBeTruthy();
    expect(drawerView.viewerRole).toBe("drawer");
    expect(guesserView.secretWord).toBeNull();
    expect(guesserView.viewerRole).toBe("guesser");
  });
});
