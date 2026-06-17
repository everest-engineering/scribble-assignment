import { describe, expect, it, beforeEach } from "vitest";
import {
  createRoom,
  joinRoom,
  getRoom,
  startGame,
  submitGuess,
  saveDrawing,
  clearDrawing,
  endRound,
  restartGame,
  toRoomSnapshot
} from "./roomStore.js";

function createTestRoom() {
  const host = createRoom("Alice");
  const guest = joinRoom(host.room.code, "Bob");
  return { host, guest: guest!, code: host.room.code, hostId: host.participantId };
}

describe("createRoom", () => {
  it("returns a room with 4-character uppercase code and hostId", () => {
    const result = createRoom("Alice");
    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.status).toBe("lobby");
  });

  it("defaults empty name to Player", () => {
    const result = createRoom("");
    expect(result.room.participants[0].name).toBe("Player");
  });

  it("defaults whitespace name to Player", () => {
    const result = createRoom("   ");
    expect(result.room.participants[0].name).toBe("Player");
  });

  it("trims leading/trailing whitespace from name", () => {
    const result = createRoom("  Alice  ");
    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("initializes score to 0", () => {
    const result = createRoom("Alice");
    expect(result.room.participants[0].score).toBe(0);
  });

  it("initializes game fields as null/empty", () => {
    const result = createRoom("Alice");
    expect(result.room.drawerId).toBeNull();
    expect(result.room.secretWord).toBeNull();
    expect(result.room.guesses).toEqual([]);
    expect(result.room.drawingData).toBeNull();
  });
});

describe("joinRoom", () => {
  it("returns null for unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");
    expect(result).toBeNull();
  });

  it("adds participant to existing room", () => {
    const host = createRoom("Alice");
    const result = joinRoom(host.room.code, "Bob");
    expect(result).not.toBeNull();
    expect(result!.room.participants).toHaveLength(2);
  });
});

describe("startGame", () => {
  it("returns error for non-existent room", () => {
    const result = startGame("ZZZZ", "p1");
    expect(result.error).toBe("Room not found");
  });

  it("returns error when non-host tries to start", () => {
    const { code } = createTestRoom();
    const result = startGame(code, "non-host-id");
    expect(result.error).toBe("Only the host can start the game");
  });

  it("returns error with fewer than 2 players", () => {
    const host = createRoom("Alice");
    const result = startGame(host.room.code, host.participantId);
    expect(result.error).toBe("At least 2 players are required to start");
  });

  it("returns error when game already started", () => {
    const { code, hostId } = createTestRoom();
    startGame(code, hostId);
    const result = startGame(code, hostId);
    expect(result.error).toBe("Game has already started");
  });

  it("assigns drawer as first participant (host)", () => {
    const { code, hostId } = createTestRoom();
    const result = startGame(code, hostId);
    expect(result.error).toBeUndefined();
    expect(result.room!.drawerId).toBe(result.room!.participants[0].id);
    expect(result.room!.status).toBe("playing");
  });

  it("selects a secret word", () => {
    const { code, hostId } = createTestRoom();
    const result = startGame(code, hostId);
    expect(result.room!.secretWord).toBeTruthy();
  });

  it("resets scores on start", () => {
    const { code, hostId } = createTestRoom();
    const room = getRoom(code)!;
    room.participants[0].score = 50;
    startGame(code, hostId);
    const updated = getRoom(code)!;
    updated.participants.forEach((p) => expect(p.score).toBe(0));
  });
});

describe("submitGuess", () => {
  function startGameAndGetIds() {
    const { code, hostId, guest } = createTestRoom();
    startGame(code, hostId);
    const room = getRoom(code)!;
    return { code, hostId, guestId: guest!.participantId, secretWord: room.secretWord! };
  }

  it("returns error for non-existent room", () => {
    const result = submitGuess("ZZZZ", "p1", "test");
    expect(result.error).toBe("Room not found");
  });

  it("returns error when round is not active", () => {
    const { code, hostId } = createTestRoom();
    const result = submitGuess(code, hostId, "test");
    expect(result.error).toBe("Round is not active");
  });

  it("returns error when drawer tries to guess", () => {
    const { code, hostId } = startGameAndGetIds();
    const result = submitGuess(code, hostId, "test");
    expect(result.error).toBe("The drawer cannot submit guesses");
  });

  it("returns error for empty guess", () => {
    const { code, guestId } = startGameAndGetIds();
    const result = submitGuess(code, guestId, "");
    expect(result.error).toBe("Guess cannot be empty");
  });

  it("returns error for whitespace-only guess", () => {
    const { code, guestId } = startGameAndGetIds();
    const result = submitGuess(code, guestId, "   ");
    expect(result.error).toBe("Guess cannot be empty");
  });

  it("accepts correct guess, awards 100 points, and ends round", () => {
    const { code, guestId, secretWord } = startGameAndGetIds();
    const result = submitGuess(code, guestId, secretWord);
    expect(result.error).toBeUndefined();
    expect(result.guess!.isCorrect).toBe(true);
    const room = getRoom(code)!;
    const guesser = room.participants.find((p) => p.id === guestId);
    expect(guesser!.score).toBe(100);
    expect(room.status).toBe("result");
  });

  it("accepts case-insensitive correct guess", () => {
    const { code, guestId, secretWord } = startGameAndGetIds();
    const result = submitGuess(code, guestId, secretWord.toUpperCase());
    expect(result.guess!.isCorrect).toBe(true);
  });

  it("accepts trimmed correct guess", () => {
    const { code, guestId, secretWord } = startGameAndGetIds();
    const result = submitGuess(code, guestId, `  ${secretWord}  `);
    expect(result.guess!.isCorrect).toBe(true);
  });

  it("rejects incorrect guess without scoring", () => {
    const { code, guestId } = startGameAndGetIds();
    const result = submitGuess(code, guestId, "wrongguess");
    expect(result.guess!.isCorrect).toBe(false);
    expect(result.error).toBeUndefined();
    const room = getRoom(code)!;
    const guesser = room.participants.find((p) => p.id === guestId);
    expect(guesser!.score).toBe(0);
  });

  it("rejects guess after round ended", () => {
    const { code, guestId, secretWord } = startGameAndGetIds();
    submitGuess(code, guestId, secretWord);
    const result = submitGuess(code, guestId, "something");
    expect(result.error).toBe("Round is not active");
  });
});

describe("saveDrawing", () => {
  it("returns error for non-existent room", () => {
    const result = saveDrawing("ZZZZ", "p1", "data:image/png;base64,abc");
    expect(result.error).toBe("Room not found");
  });

  it("returns error when non-drawer tries to save", () => {
    const { code, hostId, guest } = createTestRoom();
    startGame(code, hostId);
    const result = saveDrawing(code, guest!.participantId, "data:image/png;base64,abc");
    expect(result.error).toBe("Only the drawer can submit drawings");
  });

  it("returns error when no drawer assigned (before game start)", () => {
    const { code, hostId } = createTestRoom();
    const result = saveDrawing(code, hostId, "data:image/png;base64,abc");
    expect(result.error).toBe("Only the drawer can submit drawings");
  });

  it("saves drawing data for drawer", () => {
    const { code, hostId } = createTestRoom();
    startGame(code, hostId);
    const result = saveDrawing(code, hostId, "data:image/png;base64,abc");
    expect(result.error).toBeUndefined();
    expect(result.room!.drawingData).toBe("data:image/png;base64,abc");
  });
});

describe("clearDrawing", () => {
  it("returns error for non-existent room", () => {
    const result = clearDrawing("ZZZZ", "p1");
    expect(result.error).toBe("Room not found");
  });

  it("returns error when non-drawer tries to clear", () => {
    const { code, hostId, guest } = createTestRoom();
    startGame(code, hostId);
    const result = clearDrawing(code, guest!.participantId);
    expect(result.error).toBe("Only the drawer can clear the canvas");
  });

  it("returns error when no drawer assigned (before game start)", () => {
    const { code, hostId } = createTestRoom();
    const result = clearDrawing(code, hostId);
    expect(result.error).toBe("Only the drawer can clear the canvas");
  });

  it("clears drawing data for drawer", () => {
    const { code, hostId } = createTestRoom();
    startGame(code, hostId);
    saveDrawing(code, hostId, "data:image/png;base64,abc");
    const result = clearDrawing(code, hostId);
    expect(result.error).toBeUndefined();
    expect(result.room!.drawingData).toBeNull();
  });
});

describe("endRound", () => {
  it("returns error for non-existent room", () => {
    const result = endRound("ZZZZ", "p1");
    expect(result.error).toBe("Room not found");
  });

  it("returns error when non-drawer/host tries to end", () => {
    const { code, hostId, guest } = createTestRoom();
    startGame(code, hostId);
    const result = endRound(code, guest!.participantId);
    expect(result.error).toBe("Only the drawer or host can end the round");
  });

  it("returns error when round is not active", () => {
    const { code, hostId } = createTestRoom();
    const result = endRound(code, hostId);
    expect(result.error).toBe("Round is not active");
  });

  it("ends round when drawer requests", () => {
    const { code, hostId } = createTestRoom();
    startGame(code, hostId);
    const result = endRound(code, hostId);
    expect(result.error).toBeUndefined();
    expect(result.room!.status).toBe("result");
  });
});

describe("restartGame", () => {
  it("returns error for non-existent room", () => {
    const result = restartGame("ZZZZ", "p1");
    expect(result.error).toBe("Room not found");
  });

  it("returns error when non-host tries to restart", () => {
    const { code, hostId, guest } = createTestRoom();
    startGame(code, hostId);
    endRound(code, hostId);
    const result = restartGame(code, guest!.participantId);
    expect(result.error).toBe("Only the host can restart the game");
  });

  it("returns error when game is not in result state", () => {
    const { code, hostId } = createTestRoom();
    const result = restartGame(code, hostId);
    expect(result.error).toBe("Game is not in result state");
  });

  it("clears all round state but preserves participants and host", () => {
    const { code, hostId, guest } = createTestRoom();
    const participantIds = [hostId, guest!.participantId].sort();
    startGame(code, hostId);
    submitGuess(code, guest!.participantId, "wrong");
    saveDrawing(code, hostId, "data:image/png;base64,abc");
    endRound(code, hostId);

    const beforeRestart = getRoom(code)!;
    expect(beforeRestart.status).toBe("result");
    expect(beforeRestart.secretWord).toBeTruthy();
    expect(beforeRestart.drawingData).toBeTruthy();
    expect(beforeRestart.guesses.length).toBeGreaterThan(0);

    const result = restartGame(code, hostId);
    expect(result.error).toBeUndefined();

    const room = result.room!;
    expect(room.status).toBe("lobby");
    expect(room.drawerId).toBeNull();
    expect(room.secretWord).toBeNull();
    expect(room.guesses).toEqual([]);
    expect(room.drawingData).toBeNull();
    expect(room.hostId).toBe(hostId);
    room.participants.forEach((p) => expect(p.score).toBe(0));
    expect(room.participants.map((p) => p.id).sort()).toEqual(participantIds);
  });
});

describe("toRoomSnapshot", () => {
  it("hides secret word from non-drawer during playing", () => {
    const { code, hostId, guest } = createTestRoom();
    startGame(code, hostId);
    const guestSnapshot = toRoomSnapshot(getRoom(code)!, guest!.participantId);
    expect(guestSnapshot.secretWord).toBeNull();
  });

  it("shows secret word to drawer during playing", () => {
    const { code, hostId } = createTestRoom();
    startGame(code, hostId);
    const drawerSnapshot = toRoomSnapshot(getRoom(code)!, hostId);
    expect(drawerSnapshot.secretWord).toBeTruthy();
  });

  it("shows secret word to all players on result", () => {
    const { code, hostId, guest } = createTestRoom();
    startGame(code, hostId);
    endRound(code, hostId);
    const guestSnapshot = toRoomSnapshot(getRoom(code)!, guest!.participantId);
    expect(guestSnapshot.secretWord).toBeTruthy();
  });

  it("includes availableWords in snapshot", () => {
    const host = createRoom("Alice");
    const snapshot = toRoomSnapshot(host.room);
    expect(snapshot.availableWords).toBeInstanceOf(Array);
    expect(snapshot.availableWords.length).toBeGreaterThan(0);
  });
});
