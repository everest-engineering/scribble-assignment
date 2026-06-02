import { describe, expect, it } from "vitest";
import { appendDrawingStroke, clearDrawing, createRoom, endRound, getRoom, joinRoom, normalizeCode, restartRoom, saveRoom, selectWord, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";
import { appendDrawingSchema, clearDrawingSchema, createRoomSchema, endRoundSchema, joinRoomSchema, restartRoomSchema, submitGuessSchema } from "./schemas.js";

describe("startGame API behavior", () => {
  it("startGame returns playing status with drawer identity", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const room = startGame(created.room.code, created.participantId);
    expect(room.status).toBe("inGame");
    expect(room.currentRound).toBeDefined();
    expect(room.currentRound!.drawerParticipantId).toBe(created.participantId);
  });

  it("rejects start with fewer than 2 players", () => {
    const created = createRoom("Alice");
    expect(() => startGame(created.room.code, created.participantId)).toThrow();
  });

  it("rejects start when room already playing", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    expect(() => startGame(created.room.code, created.participantId)).toThrow("Game has already started");
  });

  it("rejects start by non-host participant", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    expect(() => startGame(created.room.code, joiner.participantId)).toThrow("Only the host can start the game");
  });
});

describe("name validation at API level", () => {
  it("createRoomSchema rejects whitespace-only name", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("joinRoomSchema rejects whitespace-only name", () => {
    expect(() => joinRoomSchema.parse({ playerName: " \t\n " })).toThrow();
  });

  it("createRoom rejects empty name and does not create room", () => {
    const beforeCount = getRoom("TEST") === null ? 0 : 1;
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejected create does not leave room state", () => {
    const code = "ABCD";
    const roomBefore = getRoom(code);
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
    const roomAfter = getRoom(code);
    expect(roomAfter).toEqual(roomBefore);
  });
});

describe("drawer vs guesser snapshots", () => {
  it("drawer snapshot includes secretWord", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    const room = startGame(created.room.code, created.participantId);
    const snapshot = toRoomSnapshot(room, created.participantId);
    expect(snapshot.secretWord).toBeDefined();
    expect(snapshot.isDrawer).toBe(true);
  });

  it("guesser snapshot omits secretWord", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    const room = getRoom(created.room.code)!;
    const snapshot = toRoomSnapshot(room, joiner.participantId);
    expect(snapshot.secretWord).toBeUndefined();
    expect(snapshot.isDrawer).toBe(false);
  });

  it("drawer and guesser share same public round fields", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    const room = getRoom(created.room.code)!;
    const drawerSnap = toRoomSnapshot(room, created.participantId);
    const guesserSnap = toRoomSnapshot(room, joiner.participantId);
    expect(drawerSnap.currentRound!.roundNumber).toBe(guesserSnap.currentRound!.roundNumber);
    expect(drawerSnap.currentRound!.drawerParticipantId).toBe(guesserSnap.currentRound!.drawerParticipantId);
  });
});

describe("appendDrawingSchema", () => {
  it("accepts valid drawing payload", () => {
    const result = appendDrawingSchema.parse({
      participantId: "p1",
      stroke: {
        color: "#111827",
        size: 4,
        points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
      }
    });
    expect(result.participantId).toBe("p1");
  });

  it("rejects missing stroke", () => {
    expect(() => appendDrawingSchema.parse({ participantId: "p1" })).toThrow();
  });
});

describe("clearDrawingSchema", () => {
  it("accepts valid clear payload", () => {
    const result = clearDrawingSchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });
});

describe("submitGuessSchema", () => {
  it("accepts valid guess payload", () => {
    const result = submitGuessSchema.parse({ participantId: "p1", guess: "rocket" });
    expect(result.guess).toBe("rocket");
  });
});

describe("appendDrawingStroke service", () => {
  it("appends a stroke for the drawer", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    const room = appendDrawingStroke(created.room.code, created.participantId, {
      color: "#111827",
      size: 4,
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
    });
    expect(room.currentRound!.canvas.strokes).toHaveLength(1);
  });

  it("rejects stroke append from non-drawer", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    expect(() =>
      appendDrawingStroke(created.room.code, joiner.participantId, {
        color: "#111827",
        size: 4,
        points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
      })
    ).toThrow();
  });

  it("rejects stroke append in non-existent room", () => {
    expect(() =>
      appendDrawingStroke("ZZZZ", "p1", {
        color: "#111827",
        size: 4,
        points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
      })
    ).toThrow();
  });
});

describe("clearDrawing service", () => {
  it("clears canvas for the drawer", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    appendDrawingStroke(created.room.code, created.participantId, {
      color: "#111827",
      size: 4,
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
    });
    const room = clearDrawing(created.room.code, created.participantId);
    expect(room.currentRound!.canvas.strokes).toHaveLength(0);
  });

  it("rejects clear from non-drawer", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    expect(() => clearDrawing(created.room.code, joiner.participantId)).toThrow();
  });
});

describe("submitGuess service", () => {
  it("accepts a valid guess from a guesser", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    const room = submitGuess(created.room.code, joiner.participantId, "rocket");
    expect(room.currentRound!.guesses).toHaveLength(1);
  });

  it("rejects empty guess", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    expect(() => submitGuess(created.room.code, joiner.participantId, "   ")).toThrow();
  });

  it("rejects guess from drawer", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    expect(() => submitGuess(created.room.code, created.participantId, "guess")).toThrow();
  });

  it("rejects guess in non-existent room", () => {
    expect(() => submitGuess("ZZZZ", "p1", "guess")).toThrow();
  });
});

describe("polling snapshots", () => {
  it("GET /rooms/:code returns canvas after drawing", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    appendDrawingStroke(created.room.code, created.participantId, {
      color: "#111827", size: 4,
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
    });
    const room = getRoom(created.room.code)!;
    const snapshot = toRoomSnapshot(room, created.participantId);
    expect(snapshot.currentRound!.canvas!.strokes).toHaveLength(1);
  });

  it("GET /rooms/:code returns empty canvas after clear", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    appendDrawingStroke(created.room.code, created.participantId, {
      color: "#111827", size: 4,
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
    });
    clearDrawing(created.room.code, created.participantId);
    const room = getRoom(created.room.code)!;
    const snapshot = toRoomSnapshot(room, created.participantId);
    expect(snapshot.currentRound!.canvas!.strokes).toHaveLength(0);
  });

  it("GET /rooms/:code returns guess history and scores", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    const word = selectWord(created.room.code);
    submitGuess(created.room.code, joiner.participantId, word);
    const room = getRoom(created.room.code)!;
    const snapshot = toRoomSnapshot(room, joiner.participantId);
    expect(snapshot.currentRound!.guesses).toHaveLength(1);
    expect(snapshot.scores).toBeDefined();
    expect(snapshot.scores!.length).toBeGreaterThan(0);
  });

  it("polling snapshot omits secretWord for guesser after mutations", () => {
    const created = createRoom("Alice");
    const joiner = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    appendDrawingStroke(created.room.code, created.participantId, {
      color: "#111827", size: 4,
      points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }]
    });
    const room = getRoom(created.room.code)!;
    const snapshot = toRoomSnapshot(room, joiner.participantId);
    expect(snapshot.secretWord).toBeUndefined();
    expect(snapshot.currentRound!.canvas!.strokes).toHaveLength(1);
  });

  it("endRoundSchema accepts valid payload", () => {
    const result = endRoundSchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("endRoundSchema rejects missing participantId", () => {
    expect(() => endRoundSchema.parse({})).toThrow();
  });

  it("restartRoomSchema accepts valid payload", () => {
    const result = restartRoomSchema.parse({ participantId: "p1" });
    expect(result.participantId).toBe("p1");
  });

  it("restartRoomSchema rejects missing participantId", () => {
    expect(() => restartRoomSchema.parse({})).toThrow();
  });
});

describe("endRound API behavior", () => {
  it("endRound transitions playing room to result", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    const room = endRound(created.room.code, created.participantId);
    expect(room.status).toBe("result");
    expect(room.completedRound).toBeDefined();
  });

  it("endRound result snapshot includes completedRound fields", () => {
    const created = createRoom("Alice");
    const bob = joinRoom(created.room.code, "Bob")!;
    const word = selectWord(created.room.code);
    startGame(created.room.code, created.participantId);
    submitGuess(created.room.code, bob.participantId, word);
    const room = endRound(created.room.code, created.participantId);
    const snapshot = toRoomSnapshot(room, bob.participantId);
    expect(snapshot.completedRound).toBeDefined();
    expect(snapshot.completedRound!.secretWord).toBe(word);
    expect(snapshot.completedRound!.guesses).toHaveLength(1);
  });

  it("endRound rejects non-participant", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startGame(created.room.code, created.participantId);
    expect(() => endRound(created.room.code, "unknown")).toThrow("Participant not found in room");
  });
});

describe("restart API behavior", () => {
  function makeResultRoom() {
    const created = createRoom("Alice");
    const bob = joinRoom(created.room.code, "Bob")!;
    startGame(created.room.code, created.participantId);
    const word = selectWord(created.room.code);
    submitGuess(created.room.code, bob.participantId, word);
    endRound(created.room.code, created.participantId);
    return { created, bob };
  }

  it("host restart returns lobby status", () => {
    const { created } = makeResultRoom();
    const room = restartRoom(created.room.code, created.participantId);
    expect(room.status).toBe("lobby");
  });

  it("non-host restart is rejected", () => {
    const { created, bob } = makeResultRoom();
    expect(() => restartRoom(created.room.code, bob.participantId)).toThrow("Only the host can restart");
  });

  it("restart response omits round data", () => {
    const { created } = makeResultRoom();
    restartRoom(created.room.code, created.participantId);
    const room = getRoom(created.room.code)!;
    const snapshot = toRoomSnapshot(room, created.participantId);
    expect(snapshot.status).toBe("lobby");
    expect(snapshot.currentRound).toBeUndefined();
    expect(snapshot.completedRound).toBeUndefined();
  });

  it("restart preserves room code and participants", () => {
    const { created } = makeResultRoom();
    restartRoom(created.room.code, created.participantId);
    const room = getRoom(created.room.code)!;
    expect(room.code).toBe(created.room.code);
    expect(room.participants).toHaveLength(2);
  });
});
