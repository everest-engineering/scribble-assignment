import { beforeEach, describe, expect, it } from "vitest";
import {
  appendDrawingStroke,
  clearDrawing,
  clearRooms,
  createRoom,
  getRoom,
  joinRoom,
  saveRoom,
  selectSecretWord,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    clearRooms();
  });

  function createStartedRoom() {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");

    if (!bob) {
      throw new Error("Unable to join test room");
    }

    const started = startRoom(room.room.code, room.participantId);

    if (!started.ok) {
      throw new Error("Unable to start test room");
    }

    return {
      room,
      bob,
      started
    };
  }

  const testStroke = {
    color: "#111827",
    size: 4,
    points: [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 }
    ]
  };

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns the creator as host in the room snapshot", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(snapshot.hostParticipantId).toBe(result.participantId);
    expect(snapshot.viewerParticipantId).toBe(result.participantId);
    expect(snapshot.isHost).toBe(true);
    expect(snapshot.canStart).toBe(false);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom normalizes room codes and preserves room isolation", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Charlie");
    const joined = joinRoom(` ${firstRoom.room.code.toLowerCase()} `, "Bob");

    expect(joined?.room.code).toBe(firstRoom.room.code);
    expect(joined?.room.participants.map((participant) => participant.name)).toEqual(["Alice", "Bob"]);
    expect(getRoom(secondRoom.room.code)?.participants.map((participant) => participant.name)).toEqual(["Charlie"]);
  });

  it("joinRoom does not mutate rooms for invalid codes", () => {
    const room = createRoom("Alice");
    const result = joinRoom("BAD", "Bob");

    expect(result).toBeNull();
    expect(getRoom(room.room.code)?.participants).toHaveLength(1);
  });

  it("joinRoom rejects rooms that are no longer in lobby state", () => {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");

    expect(bob).not.toBeNull();
    const started = startRoom(room.room.code, room.participantId);

    expect(started.ok).toBe(true);
    expect(joinRoom(room.room.code, "Charlie")).toBeNull();
  });

  it("startRoom rejects host start attempts with fewer than two players", () => {
    const room = createRoom("Alice");
    const result = startRoom(room.room.code, room.participantId);

    expect(result).toEqual({
      ok: false,
      statusCode: 400,
      message: "At least 2 players are required to start"
    });
    expect(getRoom(room.room.code)?.status).toBe("lobby");
  });

  it("startRoom rejects non-host start attempts", () => {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");

    expect(bob).not.toBeNull();
    const result = startRoom(room.room.code, bob?.participantId ?? "");

    expect(result).toEqual({
      ok: false,
      statusCode: 403,
      message: "Only the host can start the game"
    });
    expect(getRoom(room.room.code)?.status).toBe("lobby");
  });

  it("startRoom transitions only the host room when at least two players are present", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Charlie");
    joinRoom(firstRoom.room.code, "Bob");

    const result = startRoom(firstRoom.room.code, firstRoom.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.status).toBe("playing");
    expect(getRoom(firstRoom.room.code)?.status).toBe("playing");
    expect(getRoom(secondRoom.room.code)?.status).toBe("lobby");
  });

  it("startRoom assigns the host as first drawer", () => {
    const room = createRoom("Alice");
    joinRoom(room.room.code, "Bob");

    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.currentRound?.drawerParticipantId).toBe(room.participantId);
    expect(result.ok && result.room.currentRound?.roundNumber).toBe(1);
  });

  it("startRoom falls back to earliest joined player when host reference is stale", () => {
    const room = createRoom("Alice");
    joinRoom(room.room.code, "Bob");
    const staleHostRoom = getRoom(room.room.code);

    expect(staleHostRoom).not.toBeNull();
    if (!staleHostRoom) {
      return;
    }

    staleHostRoom.hostParticipantId = "missing-host";
    saveRoom(staleHostRoom);

    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.currentRound?.drawerParticipantId).toBe(room.participantId);
  });

  it("selectSecretWord is deterministic and returns null for empty word lists", () => {
    expect(selectSecretWord("ABCD", ["rocket", "pizza", "castle"])).toBe(
      selectSecretWord("ABCD", ["rocket", "pizza", "castle"])
    );
    expect(selectSecretWord("ABCD", [])).toBeNull();
  });

  it("startRoom stores the selected secret word on the current round", () => {
    const room = createRoom("Alice");
    joinRoom(room.room.code, "Bob");
    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.currentRound?.secretWord).toBe(selectSecretWord(room.room.code));
    expect(getRoom(room.room.code)?.currentRound?.secretWord).toBe(selectSecretWord(room.room.code));
  });

  it("toRoomSnapshot includes secretWord only for the drawer", () => {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");
    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    if (!result.ok || !bob) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(result.room, room.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, bob.participantId);
    const unknownSnapshot = toRoomSnapshot(result.room, "missing-player");

    expect(drawerSnapshot.isDrawer).toBe(true);
    expect(drawerSnapshot.viewerRole).toBe("drawer");
    expect(drawerSnapshot.secretWord).toBe(result.room.currentRound?.secretWord);
    expect(guesserSnapshot.isDrawer).toBe(false);
    expect(guesserSnapshot.viewerRole).toBe("guesser");
    expect("secretWord" in guesserSnapshot).toBe(false);
    expect("secretWord" in unknownSnapshot).toBe(false);
  });

  it("startRoom initializes canvas, guess history, and scores", () => {
    const { room, bob, started } = createStartedRoom();

    expect(started.room.currentRound?.canvas.strokes).toEqual([]);
    expect(started.room.currentRound?.guesses).toEqual([]);
    expect(started.room.currentRound?.correctGuessParticipantIds).toEqual([]);
    expect(started.room.scores).toEqual({
      [room.participantId]: 0,
      [bob.participantId]: 0
    });
  });

  it("appendDrawingStroke and clearDrawing are limited to the drawer", () => {
    const { room, bob } = createStartedRoom();
    const guesserDraw = appendDrawingStroke(room.room.code, bob.participantId, testStroke);

    expect(guesserDraw).toEqual({
      ok: false,
      statusCode: 403,
      message: "Only the drawer can update the canvas"
    });

    const drawerDraw = appendDrawingStroke(room.room.code, room.participantId, testStroke);

    expect(drawerDraw.ok).toBe(true);
    expect(drawerDraw.ok && drawerDraw.room.currentRound?.canvas.strokes).toHaveLength(1);
    expect(drawerDraw.ok && drawerDraw.room.currentRound?.canvas.strokes[0].points).toEqual(testStroke.points);

    const guesserClear = clearDrawing(room.room.code, bob.participantId);

    expect(guesserClear).toEqual({
      ok: false,
      statusCode: 403,
      message: "Only the drawer can clear the canvas"
    });

    const drawerClear = clearDrawing(room.room.code, room.participantId);

    expect(drawerClear.ok).toBe(true);
    expect(drawerClear.ok && drawerClear.room.currentRound?.canvas.strokes).toEqual([]);
  });

  it("rejects malformed drawing strokes without changing canvas state", () => {
    const { room } = createStartedRoom();
    const result = appendDrawingStroke(room.room.code, room.participantId, {
      color: "#111827",
      size: 4,
      points: [{ x: 0.1, y: 0.1 }]
    });

    expect(result).toEqual({
      ok: false,
      statusCode: 400,
      message: "Invalid drawing stroke"
    });
    expect(getRoom(room.room.code)?.currentRound?.canvas.strokes).toEqual([]);
  });

  it("submitGuess trims guesses and records incorrect guesses with zero points", () => {
    const { room, bob } = createStartedRoom();
    const result = submitGuess(room.room.code, bob.participantId, " wrong ");

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.currentRound?.guesses[0]).toMatchObject({
      participantId: bob.participantId,
      participantName: "Bob",
      text: "wrong",
      isCorrect: false,
      pointsAwarded: 0
    });
    expect(result.ok && result.room.scores[bob.participantId]).toBe(0);
  });

  it("submitGuess rejects empty guesses and drawer guesses", () => {
    const { room, bob } = createStartedRoom();

    expect(submitGuess(room.room.code, bob.participantId, "   ")).toEqual({
      ok: false,
      statusCode: 400,
      message: "Guess is required"
    });
    expect(submitGuess(room.room.code, room.participantId, "rocket")).toEqual({
      ok: false,
      statusCode: 403,
      message: "Drawer cannot submit guesses"
    });
    expect(getRoom(room.room.code)?.currentRound?.guesses).toEqual([]);
  });

  it("submitGuess matches case-insensitively and awards exactly 100 points once per guesser", () => {
    const { room, bob } = createStartedRoom();
    const secretWord = selectSecretWord(room.room.code);

    expect(secretWord).toBeTruthy();
    if (!secretWord) {
      return;
    }

    const firstGuess = submitGuess(room.room.code, bob.participantId, ` ${secretWord.toUpperCase()} `);
    const secondGuess = submitGuess(room.room.code, bob.participantId, secretWord.toLowerCase());

    expect(firstGuess.ok).toBe(true);
    expect(firstGuess.ok && firstGuess.room.scores[bob.participantId]).toBe(100);
    expect(firstGuess.ok && firstGuess.room.currentRound?.guesses[0].pointsAwarded).toBe(100);
    expect(secondGuess.ok).toBe(true);
    expect(secondGuess.ok && secondGuess.room.scores[bob.participantId]).toBe(100);
    expect(secondGuess.ok && secondGuess.room.currentRound?.guesses[1].pointsAwarded).toBe(0);
  });

  it("allows multiple guessers to earn the correct-guess award independently", () => {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");
    const charlie = joinRoom(room.room.code, "Charlie");
    const secretWord = selectSecretWord(room.room.code);

    expect(bob).not.toBeNull();
    expect(charlie).not.toBeNull();
    expect(secretWord).toBeTruthy();
    if (!bob || !charlie || !secretWord) {
      return;
    }

    const started = startRoom(room.room.code, room.participantId);
    expect(started.ok).toBe(true);

    const firstGuess = submitGuess(room.room.code, bob.participantId, secretWord);
    const secondGuess = submitGuess(room.room.code, charlie.participantId, secretWord);

    expect(firstGuess.ok && firstGuess.room.scores[bob.participantId]).toBe(100);
    expect(secondGuess.ok && secondGuess.room.scores[charlie.participantId]).toBe(100);
    expect(getRoom(room.room.code)?.currentRound?.guesses).toHaveLength(2);
  });

  it("keeps drawing, guess history, and scores isolated between rooms", () => {
    const first = createStartedRoom();
    const secondRoom = createRoom("Charlie");
    const dana = joinRoom(secondRoom.room.code, "Dana");

    expect(dana).not.toBeNull();
    if (!dana) {
      return;
    }

    const secondStarted = startRoom(secondRoom.room.code, secondRoom.participantId);
    expect(secondStarted.ok).toBe(true);

    appendDrawingStroke(first.room.room.code, first.room.participantId, testStroke);
    submitGuess(first.room.room.code, first.bob.participantId, selectSecretWord(first.room.room.code) ?? "");

    expect(getRoom(first.room.room.code)?.currentRound?.canvas.strokes).toHaveLength(1);
    expect(getRoom(first.room.room.code)?.currentRound?.guesses).toHaveLength(1);
    expect(getRoom(secondRoom.room.code)?.currentRound?.canvas.strokes).toEqual([]);
    expect(getRoom(secondRoom.room.code)?.currentRound?.guesses).toEqual([]);
    expect(getRoom(secondRoom.room.code)?.scores[dana.participantId]).toBe(0);
  });
});
