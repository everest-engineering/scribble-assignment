import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, submitGuess, updateCanvas, endGame, restartGame } from "./roomStore.js";
import { createRoomSchema, joinRoomSchema } from "../api/schemas.js";

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

  it("createRoom sets hostId to the creator's participantId", () => {
    const { room, participantId } = createRoom("Alice");
    expect(room.hostId).toBe(participantId);
  });

  it("createRoom initialises guesses and scores as empty", () => {
    const { room } = createRoom("Alice");
    expect(room.guesses).toEqual([]);
    expect(room.scores).toEqual({});
  });
});

describe("schemas", () => {
  it("rejects empty playerName in createRoomSchema", () => {
    expect(() => createRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejects whitespace-only playerName in createRoomSchema", () => {
    expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("trims playerName in createRoomSchema", () => {
    const result = createRoomSchema.parse({ playerName: "  Alice  " });
    expect(result.playerName).toBe("Alice");
  });

  it("rejects empty playerName in joinRoomSchema", () => {
    expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow();
  });

  it("rejects whitespace-only playerName in joinRoomSchema", () => {
    expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow();
  });

  it("trims playerName in joinRoomSchema", () => {
    const result = joinRoomSchema.parse({ playerName: "  Bob  " });
    expect(result.playerName).toBe("Bob");
  });
});

describe("startGame", () => {
  function setupTwoPlayerRoom() {
    const { room, participantId: hostId } = createRoom("Alice");
    const { participantId: guestId } = joinRoom(room.code, "Bob")!;
    return { code: room.code, hostId, guestId };
  }

  it("sets status to playing", () => {
    const { code, hostId } = setupTwoPlayerRoom();
    const result = startGame(code, hostId);
    expect(result.status).toBe("playing");
  });

  it("assigns drawer as participants[0]", () => {
    const { code, hostId } = setupTwoPlayerRoom();
    const result = startGame(code, hostId);
    expect(result.drawer).toBe(result.participants[0].id);
  });

  it("selects word at participants.length % STARTER_WORDS.length index", () => {
    const { code, hostId } = setupTwoPlayerRoom();
    const result = startGame(code, hostId);
    const STARTER_WORDS = ["rocket", "pizza", "castle", "guitar", "sunflower"];
    expect(result.secretWord).toBe(STARTER_WORDS[2 % STARTER_WORDS.length]);
  });

  it("throws 403 for non-host", () => {
    const { code, guestId } = setupTwoPlayerRoom();
    expect(() => startGame(code, guestId)).toThrow("Only the host can start the game");
  });

  it("throws 400 with fewer than 2 players", () => {
    const { room, participantId } = createRoom("Solo");
    expect(() => startGame(room.code, participantId)).toThrow("Need at least 2 players");
  });
});

describe("submitGuess", () => {
  function setupPlayingRoom() {
    const { room, participantId: hostId } = createRoom("Alice");
    const { room: r2, participantId: guestId } = joinRoom(room.code, "Bob")!;
    void r2;
    const started = startGame(room.code, hostId);
    const drawerId = started.drawer!;
    const guesserId = started.participants.find((p) => p.id !== drawerId)!.id;
    return { code: room.code, drawerId, guesserId, secretWord: started.secretWord! };
  }

  it("correct guess awards 100 points", () => {
    const { code, guesserId, secretWord } = setupPlayingRoom();
    const result = submitGuess(code, guesserId, secretWord);
    expect(result.scores[guesserId]).toBe(100);
  });

  it("incorrect guess awards 0 points", () => {
    const { code, guesserId } = setupPlayingRoom();
    const result = submitGuess(code, guesserId, "wrong answer");
    expect(result.scores[guesserId]).toBe(0);
  });

  it("duplicate correct guess keeps score at 100", () => {
    const { code, guesserId, secretWord } = setupPlayingRoom();
    submitGuess(code, guesserId, secretWord);
    const result = submitGuess(code, guesserId, secretWord);
    expect(result.scores[guesserId]).toBe(100);
  });

  it("throws 403 when drawer tries to guess", () => {
    const { code, drawerId, secretWord } = setupPlayingRoom();
    expect(() => submitGuess(code, drawerId, secretWord)).toThrow("Drawer cannot submit a guess");
  });

  it("throws 400 for empty text", () => {
    const { code, guesserId } = setupPlayingRoom();
    expect(() => submitGuess(code, guesserId, "")).toThrow();
  });
});

describe("updateCanvas", () => {
  function setupPlayingRoom() {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    const started = startGame(room.code, hostId);
    const drawerId = started.drawer!;
    const guesserId = started.participants.find((p) => p.id !== drawerId)!.id;
    return { code: room.code, drawerId, guesserId };
  }

  it("allows drawer to update canvas", () => {
    const { code, drawerId } = setupPlayingRoom();
    const result = updateCanvas(code, drawerId, "data:image/png;base64,abc");
    expect(result.canvasData).toBe("data:image/png;base64,abc");
  });

  it("throws 403 when non-drawer tries to update canvas", () => {
    const { code, guesserId } = setupPlayingRoom();
    expect(() => updateCanvas(code, guesserId, "data")).toThrow("Only the drawer can update the canvas");
  });
});

describe("endGame", () => {
  function setupPlayingRoom() {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    return { code: room.code, hostId, guestId: room.participants[0]?.id };
  }

  it("sets status to result", () => {
    const { code, hostId } = setupPlayingRoom();
    const result = endGame(code, hostId);
    expect(result.status).toBe("result");
  });

  it("throws 403 for non-host", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    const started = startGame(room.code, hostId);
    const nonHost = started.participants.find((p) => p.id !== hostId)!.id;
    expect(() => endGame(room.code, nonHost)).toThrow("Only the host can end the game");
  });
});

describe("restartGame", () => {
  function setupResultRoom() {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    endGame(room.code, hostId);
    return { code: room.code, hostId };
  }

  it("sets status to lobby and clears round state", () => {
    const { code, hostId } = setupResultRoom();
    const result = restartGame(code, hostId);
    expect(result.status).toBe("lobby");
    expect(result.drawer).toBeUndefined();
    expect(result.secretWord).toBeUndefined();
    expect(result.canvasData).toBeUndefined();
    expect(result.guesses).toEqual([]);
    expect(result.scores).toEqual({});
  });

  it("keeps participants and hostId after restart", () => {
    const { code, hostId } = setupResultRoom();
    const before = restartGame(code, hostId);
    expect(before.hostId).toBe(hostId);
    expect(before.participants).toHaveLength(2);
  });

  it("throws 403 for non-host", () => {
    const { room, participantId: hostId } = createRoom("Alice");
    joinRoom(room.code, "Bob");
    startGame(room.code, hostId);
    endGame(room.code, hostId);
    const nonHost = room.participants.find((p) => p.id !== hostId)?.id ?? "fake";
    expect(() => restartGame(room.code, nonHost)).toThrow("Only the host can restart the game");
  });
});
