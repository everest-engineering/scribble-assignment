import { describe, expect, it } from "vitest";
import { clearCanvas, createRoom, getRoom, joinRoom, leaveRoom, revealWord, startGame, submitGuess, submitStrokes, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code and assigns host", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.room.hostId).toBe(result.participantId);
      expect(result.participantId).toBeDefined();
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");

      expect(result).toBeNull();
    });

    it("adds a participant to an existing room", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Bob");

      expect(result).not.toBeNull();
      expect(result!.room.participants).toHaveLength(2);
      expect(result!.room.participants[1].name).toBe("Bob");
    });

    it("trims whitespace from player name", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "  Bob  ");

      expect(result).not.toBeNull();
      expect(result!.room.participants[1].name).toBe("Bob");
    });

    it("rejects empty name after trimming", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "   ");

      expect(result).toBeNull();
    });

    it("rejects name longer than 20 characters", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "A".repeat(21));

      expect(result).toBeNull();
    });

    it("accepts name of exactly 20 characters", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "A".repeat(20));

      expect(result).not.toBeNull();
      expect(result!.room.participants[1].name).toBe("A".repeat(20));
    });

    it("rejects duplicate name (case-sensitive)", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "Alice");

      expect(result).toBeNull();
    });

    it("accepts name that differs only by case", () => {
      const host = createRoom("Alice");
      const result = joinRoom(host.room.code, "alice");

      expect(result).not.toBeNull();
      expect(result!.room.participants[1].name).toBe("alice");
    });
  });

  describe("drawer assignment", () => {
    it("assigns first-joined participant as drawer", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      joinRoom(host.room.code, "Charlie");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.drawerId).toBe(host.participantId);
      }
    });

    it("assigns drawer deterministically regardless of host", () => {
      const host = createRoom("HostPlayer");
      const bobResult = joinRoom(host.room.code, "Bob");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.drawerId).toBe(host.participantId);
      }
    });

    it("toRoomSnapshot sets drawer role for drawer", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, host.participantId);
        expect(snapshot.yourRole).toBe("drawer");
      }
    });

    it("toRoomSnapshot sets guesser role for non-drawer", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, bobResult!.participantId);
        expect(snapshot.yourRole).toBe("guesser");
      }
    });

    it("toRoomSnapshot returns drawerId for all viewers", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const hostSnapshot = toRoomSnapshot(started.room, host.participantId);
        const bobSnapshot = toRoomSnapshot(started.room, bobResult!.participantId);
        expect(hostSnapshot.drawerId).toBe(host.participantId);
        expect(bobSnapshot.drawerId).toBe(host.participantId);
      }
    });

    it("defaults to guesser role when no viewerId provided", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room);
        expect(snapshot.yourRole).toBe("guesser");
      }
    });
  });

  describe("startGame", () => {
    it("starts the game when host calls with 2+ players", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("playing");
      }
    });

    it("returns error when non-host tries to start", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const bobResult = joinRoom(host.room.code, "Charlie");
      const result = startGame(host.room.code, bobResult!.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
        expect(result.error).toContain("host");
      }
    });

    it("returns error when fewer than 2 players", () => {
      const host = createRoom("Alice");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
        expect(result.error).toContain("2 players");
      }
    });

    it("returns error for unknown room", () => {
      const result = startGame("ZZZZ", "some-id");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(404);
      }
    });
  });

  describe("word selection", () => {
    it("selects a word from the word pool on game start", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const result = startGame(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.secretWord).toBeTruthy();
        expect(typeof result.room.secretWord).toBe("string");
      }
    });

    it("selects the same word deterministically across repeated calls", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const result1 = startGame(host.room.code, host.participantId);
      const result2 = startGame(host.room.code, host.participantId);

      expect(result1.ok && result2.ok).toBe(true);
      if (result1.ok && result2.ok) {
        expect(result1.room.secretWord).toBe(result2.room.secretWord);
      }
    });

    it("shows secret word to drawer via toRoomSnapshot", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, host.participantId);
        expect(snapshot.secretWord).toBe(started.room.secretWord);
      }
    });

    it("hides secret word from guesser via toRoomSnapshot", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);

      expect(started.ok).toBe(true);
      if (started.ok) {
        const snapshot = toRoomSnapshot(started.room, bobResult!.participantId);
        expect(snapshot.secretWord).toBeUndefined();
      }
    });
  });

  describe("leaveRoom", () => {
    it("removes a participant from the room", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const result = leaveRoom(host.room.code, bobResult!.participantId);

      expect(result.ok).toBe(true);
      if (result.ok && result.room) {
        expect(result.room.participants).toHaveLength(1);
      }
    });

    it("reassigns drawer when drawer leaves during game", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      startGame(host.room.code, host.participantId);
      const result = leaveRoom(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok && result.room) {
        expect(result.room.drawerId).not.toBe(host.participantId);
      }
    });

    it("reassigns host when host leaves", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob");
      const result = leaveRoom(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok && result.room) {
        expect(result.room.hostId).toBe(bobResult!.participantId);
      }
    });

    it("removes the room when last participant leaves", () => {
      const host = createRoom("Alice");
      const result = leaveRoom(host.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room).toBeNull();
        expect(getRoom(host.room.code)).toBeNull();
      }
    });

    it("returns error for unknown room", () => {
      const result = leaveRoom("ZZZZ", "some-id");
      expect(result.ok).toBe(false);
    });
  });

  describe("getRoom", () => {
    it("returns null for an unknown code", () => {
      expect(getRoom("ZZZZ")).toBeNull();
    });

    it("returns a cloned room for an existing code", () => {
      const created = createRoom("Alice");
      const room = getRoom(created.room.code);

      expect(room).not.toBeNull();
      expect(room!.code).toBe(created.room.code);
    });
  });

  describe("submitStrokes", () => {
    function startRoom() {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);
      return { host, started: started as { ok: true; room: import("../models/game.js").Room } };
    }

    it("accepts strokes from the drawer", () => {
      const { host, started } = startRoom();
      const stroke = { color: "#000", width: 2, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] };
      const result = submitStrokes(started.room.code, host.participantId, [stroke]);

      expect(result.ok).toBe(true);
    });

    it("rejects strokes from non-drawer", () => {
      const { started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie");
      const stroke = { color: "#000", width: 2, points: [{ x: 0, y: 0 }] };
      const result = submitStrokes(started.room.code, bobResult!.participantId, [stroke]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(403);
      }
    });

    it("rejects strokes when room is not playing", () => {
      const host = createRoom("Alice");
      const stroke = { color: "#000", width: 2, points: [{ x: 0, y: 0 }] };
      const result = submitStrokes(host.room.code, host.participantId, [stroke]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.status).toBe(400);
      }
    });

    it("stores strokes and returns them in the room snapshot", () => {
      const { host, started } = startRoom();
      const stroke = { color: "#000", width: 2, points: [{ x: 0, y: 0 }, { x: 10, y: 10 }] };
      submitStrokes(started.room.code, host.participantId, [stroke]);

      const updatedRoom = getRoom(started.room.code)!;
      const snapshot = toRoomSnapshot(updatedRoom, host.participantId);
      expect(snapshot.strokes).toHaveLength(1);
      expect(snapshot.strokes[0].color).toBe("#000");
    });

    it("returns empty strokes array when no strokes submitted", () => {
      const { host, started } = startRoom();
      const snapshot = toRoomSnapshot(started.room, host.participantId);

      expect(snapshot.strokes).toEqual([]);
    });

    it("rejects strokes for unknown room", () => {
      const result = submitStrokes("ZZZZ", "any-id", []);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(404);
    });
  });

  describe("clearCanvas", () => {
    function startRoom() {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);
      return { host, started: started as { ok: true; room: import("../models/game.js").Room } };
    }

    it("accepts clear from the drawer", () => {
      const { host, started } = startRoom();
      const result = clearCanvas(started.room.code, host.participantId);

      expect(result.ok).toBe(true);
    });

    it("resets strokes and increments clearVersion on clear", () => {
      const { host, started } = startRoom();
      const stroke = { color: "#000", width: 2, points: [{ x: 0, y: 0 }] };
      submitStrokes(started.room.code, host.participantId, [stroke]);
      const before = toRoomSnapshot(getRoom(started.room.code)!, host.participantId);
      expect(before.strokes).toHaveLength(1);
      expect(before.clearVersion).toBe(0);

      clearCanvas(started.room.code, host.participantId);
      const after = toRoomSnapshot(getRoom(started.room.code)!, host.participantId);
      expect(after.strokes).toEqual([]);
      expect(after.clearVersion).toBe(1);
    });

    it("rejects clear from non-drawer", () => {
      const { started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie");
      const result = clearCanvas(started.room.code, bobResult!.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    });

    it("rejects clear for unknown room", () => {
      const result = clearCanvas("ZZZZ", "any-id");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(404);
    });
  });

  describe("submitGuess", () => {
    function startRoom() {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);
      return { host, started: started as { ok: true; room: import("../models/game.js").Room } };
    }

    it("accepts correct guess case-insensitively", () => {
      const { host, started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie")!;
      const secretWord = started.room.secretWord!;
      const result = submitGuess(started.room.code, bobResult.participantId, secretWord.toUpperCase());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.isCorrect).toBe(true);
      }
    });

    it("returns isCorrect false for incorrect guess", () => {
      const { host, started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie")!;
      const secretWord = started.room.secretWord!;
      const result = submitGuess(started.room.code, bobResult.participantId, "ZZZ" + secretWord);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.isCorrect).toBe(false);
      }
    });

    it("rejects guess from drawer", () => {
      const { host, started } = startRoom();
      const result = submitGuess(started.room.code, host.participantId, "apple");

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    });

    it("rejects empty guess", () => {
      const { started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie");
      const result = submitGuess(started.room.code, bobResult!.participantId, "  ");

      expect(result.ok).toBe(false);
    });

    it("rejects excessively long guess", () => {
      const { started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie");
      const result = submitGuess(started.room.code, bobResult!.participantId, "A".repeat(201));

      expect(result.ok).toBe(false);
    });

    it("rejects guess after round_ended", () => {
      const { host, started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie")!;
      revealWord(started.room.code, host.participantId);
      const result = submitGuess(started.room.code, bobResult.participantId, "apple");

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(400);
    });

    it("silently ignores subsequent guesses from already-correct guesser", () => {
      const { host, started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie")!;
      const secretWord = started.room.secretWord!;
      submitGuess(started.room.code, bobResult.participantId, secretWord);
      const result = submitGuess(started.room.code, bobResult.participantId, "wrong guess");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.isCorrect).toBe(true);
      }
    });

    it("rejects guess for unknown room", () => {
      const result = submitGuess("ZZZZ", "any-id", "hello");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(404);
    });
  });

  describe("scoring", () => {
    it("awards 1 point for correct guess", () => {
      const host = createRoom("Alice");
      const charlieResult = joinRoom(host.room.code, "Charlie")!;
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      const secretWord = started.room.secretWord!;
      submitGuess(started.room.code, charlieResult.participantId, secretWord);

      const updatedRoom = getRoom(started.room.code)!;
      const snapshot = toRoomSnapshot(updatedRoom, host.participantId);
      const charlieScore = snapshot.scores.find((s) => s.participantId === charlieResult.participantId);
      expect(charlieScore?.score).toBe(1);
    });

    it("scores are deterministic for same inputs", () => {
      const host = createRoom("Alice");
      const charlieResult = joinRoom(host.room.code, "Charlie")!;
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      const secretWord = started.room.secretWord!;
      submitGuess(started.room.code, charlieResult.participantId, secretWord);

      const snapshot1 = toRoomSnapshot(getRoom(started.room.code)!, host.participantId);
      const snapshot2 = toRoomSnapshot(getRoom(started.room.code)!, host.participantId);
      expect(snapshot1.scores).toEqual(snapshot2.scores);
    });

    it("all guessers receive same point value for correct guesses", () => {
      const host = createRoom("Alice");
      const charlieResult = joinRoom(host.room.code, "Charlie")!;
      const dianaResult = joinRoom(host.room.code, "Diana")!;
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      const secretWord = started.room.secretWord!;
      submitGuess(started.room.code, charlieResult.participantId, secretWord);
      submitGuess(started.room.code, dianaResult.participantId, secretWord);

      const updatedRoom = getRoom(started.room.code)!;
      const snapshot = toRoomSnapshot(updatedRoom, host.participantId);
      const charlieScore = snapshot.scores.find((s) => s.participantId === charlieResult.participantId);
      const dianaScore = snapshot.scores.find((s) => s.participantId === dianaResult.participantId);
      expect(charlieScore?.score).toBe(1);
      expect(dianaScore?.score).toBe(1);
    });

    it("scores are sorted descending", () => {
      const host = createRoom("Alice");
      const charlieResult = joinRoom(host.room.code, "Charlie")!;
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      const secretWord = started.room.secretWord!;
      submitGuess(started.room.code, charlieResult.participantId, secretWord);

      const updatedRoom = getRoom(started.room.code)!;
      const snapshot = toRoomSnapshot(updatedRoom, host.participantId);
      const scores = snapshot.scores;
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1].score).toBeGreaterThanOrEqual(scores[i].score);
      }
    });
  });

  describe("revealWord", () => {
    function startRoom() {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId);
      return { host, started: started as { ok: true; room: import("../models/game.js").Room } };
    }

    it("transitions room to round_ended when drawer reveals", () => {
      const { host, started } = startRoom();
      const result = revealWord(started.room.code, host.participantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.room.status).toBe("round_ended");
      }
    });

    it("rejects reveal from non-drawer", () => {
      const { started } = startRoom();
      const bobResult = joinRoom(started.room.code, "Charlie");
      const result = revealWord(started.room.code, bobResult!.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(403);
    });

    it("rejects reveal when not playing", () => {
      const { host, started } = startRoom();
      revealWord(started.room.code, host.participantId);
      const result = revealWord(started.room.code, host.participantId);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(400);
    });
  });

  describe("auto round-end", () => {
    it("auto-ends round when all guessers have a correct guess", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob")!;
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      const secretWord = started.room.secretWord!;
      const result = submitGuess(started.room.code, bobResult.participantId, secretWord);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.allGuessersCorrect).toBe(true);
        expect(result.room.status).toBe("round_ended");
      }
    });

    it("does not auto-end when some guessers are still incorrect", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob")!;
      joinRoom(host.room.code, "Charlie");
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      const secretWord = started.room.secretWord!;
      const result = submitGuess(started.room.code, bobResult.participantId, secretWord);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.allGuessersCorrect).toBe(false);
        expect(result.room.status).toBe("playing");
      }
    });

    it("rejects strokes after round_ended", () => {
      const host = createRoom("Alice");
      joinRoom(host.room.code, "Bob");
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      revealWord(started.room.code, host.participantId);
      const stroke = { color: "#000", width: 2, points: [{ x: 0, y: 0 }] };
      const result = submitStrokes(started.room.code, host.participantId, [stroke]);

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.status).toBe(400);
    });

    it("reveals secretWord to non-drawer in snapshot after round_ended", () => {
      const host = createRoom("Alice");
      const bobResult = joinRoom(host.room.code, "Bob")!;
      const started = startGame(host.room.code, host.participantId) as { ok: true; room: import("../models/game.js").Room };
      revealWord(started.room.code, host.participantId);

      const updatedRoom = getRoom(started.room.code)!;
      const snapshot = toRoomSnapshot(updatedRoom, bobResult.participantId);
      expect(snapshot.secretWord).toBeDefined();
    });
  });
});
