import { describe, expect, it } from "vitest";
import {
  appendStroke,
  clearStrokes,
  createRoom,
  DrawNotDrawerError,
  DrawerCannotGuessError,
  joinRoom,
  MAX_PARTICIPANTS,
  normalizePlayerName,
  pickWord,
  PlayerNameValidationError,
  RoomCapacityError,
  RoundNotActiveError,
  startRound,
  StartInsufficientPlayersError,
  StartInvalidStateError,
  StartNotHostError,
  StrokeLimitError,
  submitGuess,
  sumCharCodes,
  toRoomSnapshot
} from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostParticipantId to the creator", () => {
    const result = createRoom("Alice");

    expect(result.room.hostParticipantId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("normalizePlayerName rejects empty names", () => {
    expect(() => normalizePlayerName("   ")).toThrow(PlayerNameValidationError);
  });

  it("normalizePlayerName rejects names longer than 24 characters", () => {
    expect(() => normalizePlayerName("a".repeat(25))).toThrow(PlayerNameValidationError);
  });

  it("joinRoom rejects when room is full", () => {
    const host = createRoom("Host");
    const code = host.room.code;

    for (let index = 1; index < MAX_PARTICIPANTS; index += 1) {
      joinRoom(code, `Player${index}`);
    }

    expect(() => joinRoom(code, "Overflow")).toThrow(RoomCapacityError);
  });

  it("pickWord is deterministic for a room code and round index", () => {
    const code = "ABCD";
    const expectedIndex = (sumCharCodes(code) + 0) % STARTER_WORDS.length;

    expect(pickWord(code, 0)).toBe(STARTER_WORDS[expectedIndex]);
    expect(pickWord(code, 0)).toBe(STARTER_WORDS[expectedIndex]);
  });

  it("startRound transitions lobby to playing with round zero", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    joinRoom(code, "Bob");

    const room = startRound(code, host.participantId);

    expect(room?.status).toBe("playing");
    expect(room?.currentRound?.roundIndex).toBe(0);
    expect(room?.currentRound?.drawerParticipantId).toBe(host.participantId);
    expect(room?.currentRound?.secretWord).toBe(pickWord(code, 0));
  });

  it("startRound rejects non-host", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob");

    expect(() => startRound(code, guest!.participantId)).toThrow(StartNotHostError);
  });

  it("startRound rejects when fewer than two players", () => {
    const host = createRoom("Alice");

    expect(() => startRound(host.room.code, host.participantId)).toThrow(
      StartInsufficientPlayersError
    );
  });

  it("startRound rejects when game already started", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    joinRoom(code, "Bob");
    startRound(code, host.participantId);

    expect(() => startRound(code, host.participantId)).toThrow(StartInvalidStateError);
  });

  it("toRoomSnapshot masks secret word for non-drawer viewers", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob")!;
    const playingRoom = startRound(code, host.participantId);

    expect(playingRoom).toBeTruthy();

    const drawerSnapshot = toRoomSnapshot(playingRoom!, host.participantId);
    const guesserSnapshot = toRoomSnapshot(playingRoom!, guest.participantId);

    expect(drawerSnapshot.currentRound?.secretWord).toBe(pickWord(code, 0));
    expect(guesserSnapshot.currentRound?.secretWord).toBeNull();
    expect(drawerSnapshot.viewer?.isDrawer).toBe(true);
    expect(guesserSnapshot.viewer?.isDrawer).toBe(false);
  });

  it("startRound initializes all scores to zero", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob")!;
    const room = startRound(code, host.participantId)!;

    expect(room.currentRound?.scores[host.participantId]).toBe(0);
    expect(room.currentRound?.scores[guest.participantId]).toBe(0);
  });

  it("appendStroke adds stroke for drawer", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    joinRoom(code, "Bob");
    startRound(code, host.participantId);

    const room = appendStroke(code, host.participantId, {
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ]
    });

    expect(room?.currentRound?.strokes).toHaveLength(1);
  });

  it("appendStroke rejects non-drawer", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob")!;
    startRound(code, host.participantId);

    expect(() =>
      appendStroke(code, guest.participantId, {
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 }
        ]
      })
    ).toThrow(DrawNotDrawerError);
  });

  it("clearStrokes empties stroke list", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    joinRoom(code, "Bob");
    startRound(code, host.participantId);
    appendStroke(code, host.participantId, {
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ]
    });

    const room = clearStrokes(code, host.participantId);

    expect(room?.currentRound?.strokes).toHaveLength(0);
  });

  it("submitGuess records incorrect guess without score change", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob")!;
    startRound(code, host.participantId);

    const room = submitGuess(code, guest.participantId, "wrong")!;

    expect(room.status).toBe("playing");
    expect(room.currentRound?.guesses).toHaveLength(1);
    expect(room.currentRound?.guesses[0].isCorrect).toBe(false);
    expect(room.currentRound?.scores[guest.participantId]).toBe(0);
  });

  it("submitGuess awards 100 and transitions to result on correct guess", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob")!;
    const playing = startRound(code, host.participantId)!;
    const secretWord = playing.currentRound!.secretWord;

    const room = submitGuess(code, guest.participantId, `  ${secretWord.toUpperCase()}  `)!;

    expect(room.status).toBe("result");
    expect(room.currentRound?.scores[guest.participantId]).toBe(100);
    expect(room.currentRound?.winnerParticipantId).toBe(guest.participantId);
  });

  it("submitGuess rejects drawer", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    joinRoom(code, "Bob");
    startRound(code, host.participantId);

    expect(() => submitGuess(code, host.participantId, "rocket")).toThrow(DrawerCannotGuessError);
  });

  it("submitGuess rejects after result state", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob")!;
    const playing = startRound(code, host.participantId)!;
    submitGuess(code, guest.participantId, playing.currentRound!.secretWord);

    expect(() => submitGuess(code, guest.participantId, "again")).toThrow(RoundNotActiveError);
  });

  it("appendStroke rejects when stroke cap reached", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    joinRoom(code, "Bob");
    startRound(code, host.participantId);

    for (let index = 0; index < 500; index += 1) {
      appendStroke(code, host.participantId, {
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 }
        ]
      });
    }

    expect(() =>
      appendStroke(code, host.participantId, {
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 }
        ]
      })
    ).toThrow(StrokeLimitError);
  });

  it("toRoomSnapshot includes strokes and guesses for all viewers", () => {
    const host = createRoom("Alice");
    const code = host.room.code;
    const guest = joinRoom(code, "Bob")!;
    startRound(code, host.participantId);
    appendStroke(code, host.participantId, {
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4 }
      ]
    });
    submitGuess(code, guest.participantId, "wrong");
    const room = submitGuess(code, guest.participantId, pickWord(code, 0))!;

    const snapshot = toRoomSnapshot(room, guest.participantId);

    expect(snapshot.currentRound?.strokes).toHaveLength(1);
    expect(snapshot.currentRound?.guesses.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.currentRound?.scores.find((entry) => entry.participantId === guest.participantId)?.score).toBe(
      100
    );
  });
});
