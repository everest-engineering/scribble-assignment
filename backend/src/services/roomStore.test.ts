import { describe, expect, it } from "vitest";
import {
  appendStroke,
  clearCanvas,
  createRoom,
  endRound,
  getCanvasState,
  getRoom,
  joinRoom,
  leaveRoom,
  returnToLobby,
  startNewRound,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

function wordIndex(code: string): number {
  return code.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 5;
}

function setupGame() {
  const { room, participantId: hostId } = createRoom("Alice");
  const { participantId: bobId } = joinRoom(room.code, "Bob")!;
  const started = startRoom(room.code, hostId)!;
  return { room: started, hostId, bobId, code: room.code };
}

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  describe("startRoom", () => {
    it("assigns drawer role to the host who started the game", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const guestId = joinRoom(room.code, "Bob")!.participantId;

      const started = startRoom(room.code, hostId);

      expect(started).not.toBeNull();
      expect(started!.status).toBe("playing");
      const host = started!.participants.find((p) => p.id === hostId);
      expect(host?.role).toBe("drawer");
      const guest = started!.participants.find((p) => p.id === guestId);
      expect(guest?.role).toBe("guesser");
    });

    it("assigns drawer role with 3 participants", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      joinRoom(room.code, "Charlie");

      const started = startRoom(room.code, hostId);

      const host = started!.participants.find((p) => p.id === hostId);
      expect(host?.role).toBe("drawer");
      const guessers = started!.participants.filter((p) => p.id !== hostId);
      expect(guessers).toHaveLength(2);
      guessers.forEach((g) => expect(g.role).toBe("guesser"));
    });

    it("assigns drawer role with 4 participants", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      joinRoom(room.code, "Charlie");
      joinRoom(room.code, "Diana");

      const started = startRoom(room.code, hostId);

      const host = started!.participants.find((p) => p.id === hostId);
      expect(host?.role).toBe("drawer");
      const guessers = started!.participants.filter((p) => p.id !== hostId);
      expect(guessers).toHaveLength(3);
      guessers.forEach((g) => expect(g.role).toBe("guesser"));
    });

    it("selects a word deterministically based on room code", () => {
      const { room } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const started = startRoom(room.code, room.participants[0].id);

      expect(started!.secretWord).toBe(STARTER_WORDS[wordIndex(room.code)]);
    });

    it("selects word from STARTER_WORDS list", () => {
      const { room } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const started = startRoom(room.code, room.participants[0].id);

      expect(STARTER_WORDS).toContain(started!.secretWord);
    });
  });

  describe("toRoomSnapshot", () => {
    it("reveals secretWord to the drawer (host) via startRoom result", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const started = startRoom(room.code, hostId);

      expect(started).not.toBeNull();
      expect(started!.secretWord).toBeDefined();
    });

    it("assigns guesser role to non-host participants", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const guestId = joinRoom(room.code, "Bob")!.participantId;

      const started = startRoom(room.code, hostId);

      const guest = started!.participants.find((p) => p.id === guestId);
      expect(guest?.role).toBe("guesser");
    });
  });

  describe("submitGuess", () => {
    it("returns null for a non-existent room", () => {
      const result = submitGuess("ZZZZ", "any-id", "word");
      expect(result).toBeNull();
    });

    it("rejects guess from drawer", () => {
      const { room, hostId } = setupGame();

      const result = submitGuess(room.code, hostId, "guess");

      expect(result).not.toBeNull();
      expect(result).toHaveProperty("rejected", true);
    });

    it("returns correct:true for matching word (case-insensitive)", () => {
      const { room, bobId } = setupGame();
      const word = room.secretWord!;

      const result = submitGuess(room.code, bobId, word.toUpperCase());

      expect(result).not.toBeNull();
      expect(result!.correct).toBe(true);
      expect(result!.points).toBe(100);
    });

    it("returns correct:false for wrong word", () => {
      const { room, bobId } = setupGame();

      const result = submitGuess(room.code, bobId, "wrongword");

      expect(result).not.toBeNull();
      expect(result!.correct).toBe(false);
      expect(result!.points).toBe(0);
    });

    it("rejects empty whitespace guess", () => {
      const { room, bobId } = setupGame();

      const result = submitGuess(room.code, bobId, "   ");

      expect(result).not.toBeNull();
      expect(result).toHaveProperty("rejected", true);
    });

    it("detects already-guessed correctly", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room1.code, "Bob")!.participantId;
      const carolId = joinRoom(room1.code, "Carol")!.participantId;
      const started = startRoom(room1.code, hostId)!;

      submitGuess(room1.code, bobId, started.secretWord!);
      const result = submitGuess(room1.code, bobId, "anything");

      expect(result).not.toBeNull();
      expect(result!.alreadyGuessed).toBe(true);
    });

    it("detects duplicate incorrect guess", () => {
      const { room, bobId } = setupGame();

      submitGuess(room.code, bobId, "wrong");
      const result = submitGuess(room.code, bobId, "wrong");

      expect(result).not.toBeNull();
      expect(result).toHaveProperty("duplicate", true);
    });

    it("records guess in guessLog via toRoomSnapshot when round ends", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room1.code, "Bob")!.participantId;
      startRoom(room1.code, hostId)!;

      submitGuess(room1.code, bobId, "testguess");

      const freshRoom = getRoom(room1.code)!;
      const snapshot = toRoomSnapshot(freshRoom, bobId);
      expect(snapshot.guessLog).toBeDefined();
      expect(snapshot.guessLog!.length).toBeGreaterThanOrEqual(1);
      expect(snapshot.guessLog![0].correct).toBe(false);
    });
  });

  describe("scoring", () => {
    it("awards 100 points to guesser on correct guess", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room1.code, "Bob")!.participantId;
      const started = startRoom(room1.code, hostId)!;

      submitGuess(room1.code, bobId, started.secretWord!);

      const freshRoom = getRoom(room1.code)!;
      const snapshot = toRoomSnapshot(freshRoom, bobId);
      expect(snapshot.scores![bobId]).toBe(100);
    });

    it("does not award points for incorrect guess", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room1.code, "Bob")!.participantId;
      startRoom(room1.code, hostId)!;

      submitGuess(room1.code, bobId, "wrong");

      const freshRoom = getRoom(room1.code)!;
      const snapshot = toRoomSnapshot(freshRoom, bobId);
      expect(snapshot.scores![bobId]).toBeUndefined();
    });

    it("auto-ends round when all guessers guess correctly", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const { participantId: bobId } = joinRoom(room1.code, "Bob")!;
      const { participantId: carolId } = joinRoom(room1.code, "Carol")!;
      const started = startRoom(room1.code, hostId)!;

      submitGuess(room1.code, bobId, started.secretWord!);
      const result = submitGuess(room1.code, carolId, started.secretWord!);

      expect(result!.correct).toBe(true);
      const freshRoom = getRoom(room1.code)!;
      const snapshot = toRoomSnapshot(freshRoom, bobId);
      expect(snapshot.roundEnded).toBe(true);
      expect(snapshot.status).toBe("round_end");
    });

    it("awards drawer 100 pts per guesser who did not guess correctly on endRound", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room1.code, "Bob")!.participantId;
      const carolId = joinRoom(room1.code, "Carol")!.participantId;
      const started = startRoom(room1.code, hostId)!;

      submitGuess(room1.code, bobId, started.secretWord!);
      endRound(room1.code, hostId);

      const freshRoom = getRoom(room1.code)!;
      const snapshot = toRoomSnapshot(freshRoom, hostId);
      // Carol didn't guess correctly → drawer gets 100
      expect(snapshot.scores![hostId]).toBe(100);
    });
  });

  describe("endRound", () => {
    it("returns null for non-existent room", () => {
      const result = endRound("ZZZZ");
      expect(result).toBeNull();
    });

    it("returns null if room is not in playing status", () => {
      const result = createRoom("Alice");
      const roomResult = endRound(result.room.code);
      expect(roomResult).toBeNull();
    });

    it("refuses end round from non-host participant", () => {
      const { room, bobId } = setupGame();
      const result = endRound(room.code, bobId);
      expect(result).toBeNull();
    });

    it("ends round when called by host", () => {
      const { room, hostId } = setupGame();

      const result = endRound(room.code, hostId);

      expect(result).not.toBeNull();
      expect(result!.status).toBe("round_end");
      expect(result!.roundEnded).toBe(true);
    });

    it("exposes secretWord to all after round ends", () => {
      const { room: room1, hostId, bobId } = setupGame();

      endRound(room1.code, hostId);

      const freshRoom = getRoom(room1.code)!;
      const snapshot = toRoomSnapshot(freshRoom, bobId);
      expect(snapshot.secretWord).toBeDefined();
      expect(snapshot.roundEnded).toBe(true);
    });
  });

  describe("canvas operations", () => {
    it("appendStroke stores a stroke and returns count", () => {
      const { room, hostId } = setupGame();

      const result = appendStroke(room.code, hostId, {
        color: "#000",
        points: [{ x: 0, y: 0 }, { x: 10, y: 10 }]
      });

      expect(result).toEqual({ strokeCount: 1 });
    });

    it("getCanvasState returns stored strokes", () => {
      const { room, hostId } = setupGame();
      appendStroke(room.code, hostId, {
        color: "#000",
        points: [{ x: 0, y: 0 }]
      });

      const strokes = getCanvasState(room.code);
      expect(strokes).toHaveLength(1);
      expect(strokes[0].color).toBe("#000");
    });

    it("clearCanvas removes all strokes", () => {
      const { room, hostId } = setupGame();
      appendStroke(room.code, hostId, {
        color: "#000",
        points: [{ x: 0, y: 0 }]
      });

      clearCanvas(room.code, hostId);
      const strokes = getCanvasState(room.code);
      expect(strokes).toHaveLength(0);
    });

    it("clearCanvas is a no-op on empty canvas (no error)", () => {
      const { room, hostId } = setupGame();

      const result = clearCanvas(room.code, hostId);
      expect(result).toEqual({ cleared: true });
    });

    it("appendStroke returns null for non-drawer", () => {
      const { room, bobId } = setupGame();

      const result = appendStroke(room.code, bobId, {
        color: "#000",
        points: [{ x: 0, y: 0 }]
      });

      expect(result).toBeNull();
    });

    it("appendStroke returns null for non-existent room", () => {
      const result = appendStroke("ZZZZ", "any-id", {
        color: "#000",
        points: [{ x: 0, y: 0 }]
      });
      expect(result).toBeNull();
    });
  });

  describe("host transfer", () => {
    it("transfers host to earliest joiner when host leaves", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room.code, "Bob")!.participantId;
      const charlieId = joinRoom(room.code, "Charlie")!.participantId;

      leaveRoom(room.code, hostId);

      const joined = joinRoom(room.code, "Diana");
      expect(joined).not.toBeNull();
      expect(joined!.room.hostId).toBe(bobId);
    });

    it("assigns new host as drawer when game starts after host transfer", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room.code, "Bob")!.participantId;
      joinRoom(room.code, "Charlie");

      leaveRoom(room.code, hostId);

      const started = startRoom(room.code, bobId);

      expect(started).not.toBeNull();
      expect(started!.status).toBe("playing");
      const newHost = started!.participants.find((p) => p.id === bobId);
      expect(newHost?.role).toBe("drawer");
    });
  });

  describe("returnToLobby", () => {
    it("returns null for non-existent room", () => {
      const result = returnToLobby("ZZZZ", "any-id");
      expect(result).toBeNull();
    });

    it("returns null if requester is not host", () => {
      const { room, hostId, bobId } = setupGame();
      endRound(room.code, hostId);
      const result = returnToLobby(room.code, bobId);
      expect(result).toBeNull();
    });

    it("returns null if room is not in round_end status", () => {
      const { room, hostId } = setupGame();
      const result = returnToLobby(room.code, hostId);
      expect(result).toBeNull();
    });

    it("transitions room back to lobby when host returns", () => {
      const { room, hostId } = setupGame();
      endRound(room.code, hostId);
      const result = returnToLobby(room.code, hostId);
      expect(result).not.toBeNull();
      expect(result!.status).toBe("lobby");
      expect(result!.roundEnded).toBe(false);
    });
  });

  describe("startNewRound", () => {
    it("returns null for non-existent room", () => {
      const result = startNewRound("ZZZZ", "any-id");
      expect(result).toBeNull();
    });

    it("returns null if requester is not host", () => {
      const { room, hostId, bobId } = setupGame();
      endRound(room.code, hostId);
      returnToLobby(room.code, hostId);
      const result = startNewRound(room.code, bobId);
      expect(result).toBeNull();
    });

    it("returns null if room is not in lobby status", () => {
      const { room, hostId } = setupGame();
      const result = startNewRound(room.code, hostId);
      expect(result).toBeNull();
    });

    it("starts a new round with incremented roundCounter", () => {
      const { room, hostId } = setupGame();
      endRound(room.code, hostId);
      returnToLobby(room.code, hostId);
      const result = startNewRound(room.code, hostId);
      expect(result).not.toBeNull();
      expect(result!.status).toBe("playing");
      expect(result!.roundCounter).toBe(2);
    });

    it("rotates drawer to next participant", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room1.code, "Bob")!.participantId;
      joinRoom(room1.code, "Charlie");
      const started = startRoom(room1.code, hostId)!;
      const firstDrawer = started.participants.find((p) => p.role === "drawer")!.id;

      endRound(room1.code, hostId);
      returnToLobby(room1.code, hostId);
      const result = startNewRound(room1.code, hostId)!;
      const secondDrawer = result.participants.find((p) => p.role === "drawer")!.id;
      expect(secondDrawer).not.toBe(firstDrawer);
      expect(secondDrawer).toBe(bobId);
    });

    it("resets round-specific state", () => {
      const { room, hostId } = setupGame();
      endRound(room.code, hostId);
      returnToLobby(room.code, hostId);
      const result = startNewRound(room.code, hostId);
      expect(result!.guessLog).toHaveLength(0);
      expect(result!.roundEnded).toBe(false);
    });

    it("does not reset cumulative scores", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room1.code, "Bob")!.participantId;
      joinRoom(room1.code, "Charlie");
      const started = startRoom(room1.code, hostId)!;
      submitGuess(room1.code, bobId, started.secretWord!);
      const snapshot1 = toRoomSnapshot(getRoom(room1.code)!, bobId);
      const bobScore = snapshot1.scores![bobId];

      endRound(room1.code, hostId);
      returnToLobby(room1.code, hostId);
      const result = startNewRound(room1.code, hostId)!;
      expect(result.scores[bobId]).toBe(bobScore);
    });
  });

  describe("leave validation", () => {
    it("rejects leave when drawer tries to leave mid-round", () => {
      const { room, hostId } = setupGame();
      const result = leaveRoom(room.code, hostId);
      expect(result).toBe(false);
    });

    it("allows guesser to leave mid-round", () => {
      const { room, bobId } = setupGame();
      const result = leaveRoom(room.code, bobId);
      expect(result).not.toBeNull();
      expect(result).not.toBe(false);
    });

    it("returns null for non-existent participant", () => {
      const { room } = setupGame();
      const result = leaveRoom(room.code, "non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("multi-round flow", () => {
    it("transitions to game_over after final round ends", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      joinRoom(room1.code, "Bob");
      const started = startRoom(room1.code, hostId)!;
      expect(started.maxRounds).toBe(2);

      endRound(room1.code, hostId);
      returnToLobby(room1.code, hostId);
      startNewRound(room1.code, hostId);

      endRound(room1.code, hostId);
      const snapshot = toRoomSnapshot(getRoom(room1.code)!, hostId);
      expect(snapshot.status).toBe("game_over");
    });

    it("includes finalStandings in snapshot at game_over", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      joinRoom(room1.code, "Bob");
      startRoom(room1.code, hostId)!;

      endRound(room1.code, hostId);
      returnToLobby(room1.code, hostId);
      startNewRound(room1.code, hostId);
      endRound(room1.code, hostId);

      const snapshot = toRoomSnapshot(getRoom(room1.code)!, hostId);
      expect(snapshot.finalStandings).toBeDefined();
      expect(snapshot.finalStandings!.length).toBe(2);
      expect(snapshot.finalStandings![0].rank).toBe(1);
    });

    it("computes maxRounds based on participant count at first round start", () => {
      const { room: room1, participantId: hostId } = createRoom("Alice");
      joinRoom(room1.code, "Bob");
      joinRoom(room1.code, "Charlie");
      joinRoom(room1.code, "Diana");

      const started = startRoom(room1.code, hostId)!;
      expect(started.maxRounds).toBe(4);
    });
  });
});
