import { describe, expect, it } from "vitest";
import {
  appendDrawingStroke,
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
  normalizeCode,
  saveRoom,
  selectWord,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

function makeStroke() {
  return {
    color: "#111827",
    size: 4,
    points: [{ x: 0.1, y: 0.2 }, { x: 0.3, y: 0.4 }, { x: 0.5, y: 0.6 }]
  };
}

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.participantId).toBeDefined();
    });

    it("assigns the creator as host", () => {
      const result = createRoom("Alice");
      expect(result.room.hostParticipantId).toBe(result.participantId);
    });

    it("sets status to lobby", () => {
      const result = createRoom("Alice");
      expect(result.room.status).toBe("lobby");
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");
      expect(result).toBeNull();
    });

    it("normalizes room code before lookup", () => {
      const created = createRoom("Alice");
      const result = joinRoom(created.room.code.toLowerCase(), "Bob");
      expect(result).not.toBeNull();
      expect(result!.room.participants).toHaveLength(2);
    });

    it("does not mutate any room on invalid code", () => {
      const created = createRoom("Alice");
      const snapshotBefore = getRoom(created.room.code);
      const result = joinRoom("ZZZZ", "Bob");
      expect(result).toBeNull();
      const snapshotAfter = getRoom(created.room.code);
      expect(snapshotAfter!.participants).toHaveLength(
        snapshotBefore!.participants.length
      );
    });

    it("isolates rooms: joining one room does not affect another", () => {
      const room1 = createRoom("Alice");
      const room2 = createRoom("Charlie");
      joinRoom(room1.room.code, "Bob");
      const snap1 = getRoom(room1.room.code);
      const snap2 = getRoom(room2.room.code);
      expect(snap1!.participants).toHaveLength(2);
      expect(snap2!.participants).toHaveLength(1);
    });
  });

  describe("getRoom", () => {
    it("normalizes code when fetching", () => {
      const created = createRoom("Alice");
      const fetched = getRoom(created.room.code.toLowerCase());
      expect(fetched).not.toBeNull();
      expect(fetched!.code).toBe(created.room.code);
    });

    it("returns null for non-existent room", () => {
      expect(getRoom("NONEXIST")).toBeNull();
    });
  });

  describe("startGame", () => {
    it("rejects start with fewer than 2 players", () => {
      const created = createRoom("Alice");
      expect(() =>
        startGame(created.room.code, created.participantId)
      ).toThrow("At least 2 players are needed to start");
    });

    it("rejects start by non-host participant", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob");
      expect(() =>
        startGame(created.room.code, joiner!.participantId)
      ).toThrow("Only the host can start the game");
    });

    it("allows host to start with 2 players", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      const result = startGame(created.room.code, created.participantId);
      expect(result.status).toBe("inGame");
    });

    it("transitions room status to inGame on successful start", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      const snap = getRoom(created.room.code);
      expect(snap!.status).toBe("inGame");
    });

    it("assigns host as drawer when host is a current participant", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      const room = startGame(created.room.code, created.participantId);
      expect(room.currentRound).toBeDefined();
      expect(room.currentRound!.drawerParticipantId).toBe(created.participantId);
    });

    it("assigns earliest joined player as drawer when host is missing", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob");
      const room = getRoom(created.room.code)!;
      room.hostParticipantId = null;
      saveRoom(room);
      const started = startGame(created.room.code, joiner!.participantId);
      expect(started.currentRound).toBeDefined();
      expect(started.currentRound!.drawerParticipantId).toBe(created.participantId);
    });

    it("creates currentRound with round number 1 on start", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      const room = startGame(created.room.code, created.participantId);
      expect(room.currentRound).toBeDefined();
      expect(room.currentRound!.roundNumber).toBe(1);
    });

    it("includes drawer identity in snapshot after start", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      const room = startGame(created.room.code, created.participantId);
      const snapshot = toRoomSnapshot(room, created.participantId);
      expect(snapshot.currentRound).toBeDefined();
      expect(snapshot.currentRound!.drawerParticipantId).toBe(created.participantId);
      expect(snapshot.viewerRole).toBe("drawer");
      expect(snapshot.isDrawer).toBe(true);
    });

    it("shows guesser role for non-drawer participant", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      const room = getRoom(created.room.code)!;
      const snapshot = toRoomSnapshot(room, joiner.participantId);
      expect(snapshot.viewerRole).toBe("guesser");
      expect(snapshot.isDrawer).toBe(false);
    });
  });

  describe("selectWord", () => {
    it("returns a word from the starter list", () => {
      const word = selectWord("ABCD");
      expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(word);
    });

    it("returns deterministic result for same room code", () => {
      const word1 = selectWord("ABCD");
      const word2 = selectWord("ABCD");
      expect(word1).toBe(word2);
    });

    it("returns different results for different room codes", () => {
      const word1 = selectWord("ABCD");
      const word2 = selectWord("EFGH");
      expect(word1).not.toBe(word2);
    });

    it("throws when word list is empty", () => {
      expect(() => selectWord("ABCD", [])).toThrow("No starter words available");
    });
  });

  describe("snapshot secretWord privacy", () => {
    it("includes secretWord in drawer snapshot", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      const room = startGame(created.room.code, created.participantId);
      const snapshot = toRoomSnapshot(room, created.participantId);
      expect(snapshot.secretWord).toBeDefined();
      expect(snapshot.secretWord!.length).toBeGreaterThan(0);
    });

    it("omits secretWord from guesser snapshot", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      const room = getRoom(created.room.code)!;
      const snapshot = toRoomSnapshot(room, joiner.participantId);
      expect(snapshot.secretWord).toBeUndefined();
    });

    it("omits secretWord from unknown viewer snapshot", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      const room = getRoom(created.room.code)!;
      const snapshot = toRoomSnapshot(room, "unknown-id");
      expect(snapshot.secretWord).toBeUndefined();
    });

    it("persists the same secret word on repeated snapshots", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      const room = getRoom(created.room.code)!;
      const snap1 = toRoomSnapshot(room, created.participantId);
      const snap2 = toRoomSnapshot(room, created.participantId);
      expect(snap1.secretWord).toBe(snap2.secretWord);
    });
  });

  describe("normalizeCode", () => {
    it("trims and uppercases room code", () => {
      expect(normalizeCode("  abcd  ")).toBe("ABCD");
    });
  });

  describe("appendDrawingStroke", () => {
    it("appends a stroke to the canvas when drawer submits", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      const stroke = makeStroke();
      const room = appendDrawingStroke(created.room.code, created.participantId, stroke);
      expect(room.currentRound!.canvas.strokes).toHaveLength(1);
      expect(room.currentRound!.canvas.strokes[0].color).toBe("#111827");
    });

    it("returns snapshot with strokes array", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      const stroke = makeStroke();
      const room = appendDrawingStroke(created.room.code, created.participantId, stroke);
      const snapshot = toRoomSnapshot(room, created.participantId);
      expect(snapshot.currentRound!.canvas!.strokes).toHaveLength(1);
    });

    it("rejects stroke append from non-drawer participant", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      const stroke = makeStroke();
      expect(() =>
        appendDrawingStroke(created.room.code, joiner.participantId, stroke)
      ).toThrow("Only the drawer can draw");
    });

    it("rejects stroke append in non-existent room", () => {
      expect(() =>
        appendDrawingStroke("ZZZZ", "p1", makeStroke())
      ).toThrow("Room not found");
    });

    it("rejects stroke append when room is not playing", () => {
      const created = createRoom("Alice");
      expect(() =>
        appendDrawingStroke(created.room.code, created.participantId, makeStroke())
      ).toThrow("Game is not in progress");
    });
  });

  describe("clearDrawing", () => {
    it("clears all strokes from the canvas when drawer clears", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      appendDrawingStroke(created.room.code, created.participantId, makeStroke());
      const room = clearDrawing(created.room.code, created.participantId);
      expect(room.currentRound!.canvas.strokes).toHaveLength(0);
    });

    it("rejects clear from non-drawer participant", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      expect(() =>
        clearDrawing(created.room.code, joiner.participantId)
      ).toThrow("Only the drawer can draw");
    });
  });

  describe("submitGuess", () => {
    it("rejects empty guess after trimming", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      const room = getRoom(created.room.code)!;
      expect(() =>
        submitGuess(room.code, joiner.participantId, "   ")
      ).toThrow("Guess cannot be empty");
    });

    it("trims guess text and records trimmed value", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      const roomData = submitGuess(created.room.code, joiner.participantId, "  rocket  ");
      expect(roomData.currentRound!.guesses[0].text).toBe("rocket");
    });

    it("marks incorrect guesses as not correct with 0 points", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      const roomData = submitGuess(created.room.code, joiner.participantId, "wrong");
      const guess = roomData.currentRound!.guesses[0];
      expect(guess.isCorrect).toBe(false);
      expect(guess.pointsAwarded).toBe(0);
    });

    it("matches correct guess case-insensitively", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      const word = selectWord(created.room.code);
      startGame(created.room.code, created.participantId);
      const roomData = submitGuess(created.room.code, joiner.participantId, word.toUpperCase());
      const guess = roomData.currentRound!.guesses[0];
      expect(guess.isCorrect).toBe(true);
    });

    it("awards exactly 100 points for first correct guess", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      startGame(created.room.code, created.participantId);
      const roomData = submitGuess(created.room.code, joiner.participantId, selectWord(created.room.code));
      const guess = roomData.currentRound!.guesses[0];
      expect(guess.pointsAwarded).toBe(100);
    });

    it("awards 0 points for duplicate correct guess by same participant", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      const word = selectWord(created.room.code);
      startGame(created.room.code, created.participantId);
      submitGuess(created.room.code, joiner.participantId, word);
      const roomData = submitGuess(created.room.code, joiner.participantId, word);
      const lastGuess = roomData.currentRound!.guesses[roomData.currentRound!.guesses.length - 1];
      expect(lastGuess.pointsAwarded).toBe(0);
    });

    it("rejects guess from drawer participant", () => {
      const created = createRoom("Alice");
      joinRoom(created.room.code, "Bob");
      startGame(created.room.code, created.participantId);
      expect(() =>
        submitGuess(created.room.code, created.participantId, "guess")
      ).toThrow("Drawer cannot submit guesses");
    });

    it("awards score only for the first correct guess per guesser", () => {
      const created = createRoom("Alice");
      const joiner = joinRoom(created.room.code, "Bob")!;
      const word = selectWord(created.room.code);
      startGame(created.room.code, created.participantId);
      const room1 = submitGuess(created.room.code, joiner.participantId, word);
      expect(room1.scores[joiner.participantId]).toBe(100);
      const room2 = submitGuess(created.room.code, joiner.participantId, word);
      expect(room2.scores[joiner.participantId]).toBe(100);
    });

    it("awards correct guess points to multiple guessers", () => {
      const created = createRoom("Alice");
      const bob = joinRoom(created.room.code, "Bob")!;
      const charlie = joinRoom(created.room.code, "Charlie")!;
      const word = selectWord(created.room.code);
      startGame(created.room.code, created.participantId);
      const room1 = submitGuess(created.room.code, bob.participantId, word);
      expect(room1.scores[bob.participantId]).toBe(100);
      const room2 = submitGuess(created.room.code, charlie.participantId, word);
      expect(room2.scores[charlie.participantId]).toBe(100);
    });
  });

  describe("room isolation", () => {
    it("drawing in one room does not affect another room's canvas", () => {
      const room1 = createRoom("Alice");
      joinRoom(room1.room.code, "Bob");
      const room2 = createRoom("Charlie");
      joinRoom(room2.room.code, "Dave");
      startGame(room1.room.code, room1.participantId);
      startGame(room2.room.code, room2.participantId);
      appendDrawingStroke(room1.room.code, room1.participantId, makeStroke());
      const snap1 = getRoom(room1.room.code)!;
      const snap2 = getRoom(room2.room.code)!;
      expect(snap1.currentRound!.canvas.strokes).toHaveLength(1);
      expect(snap2.currentRound!.canvas.strokes).toHaveLength(0);
    });

    it("guessing in one room does not affect another room's scores", () => {
      const room1 = createRoom("Alice");
      const bob = joinRoom(room1.room.code, "Bob")!;
      const room2 = createRoom("Charlie");
      const dave = joinRoom(room2.room.code, "Dave")!;
      startGame(room1.room.code, room1.participantId);
      startGame(room2.room.code, room2.participantId);
      const word1 = selectWord(room1.room.code);
      submitGuess(room1.room.code, bob.participantId, word1);
      const snap1 = getRoom(room1.room.code)!;
      const snap2 = getRoom(room2.room.code)!;
      expect(snap1.scores[bob.participantId]).toBe(100);
      expect(snap2.scores[dave.participantId]).toBe(0);
    });
  });
});
