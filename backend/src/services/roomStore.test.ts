import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDrawing,
  createRoom,
  joinRoom,
  resetRoomsForTests,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    resetRoomsForTests();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom(" Alice ");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].isHost).toBe(true);
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("starts a game only when the host has at least 2 players", () => {
    const host = createRoom("Alice");
    const soloStart = () => startGame(host.room.code, host.participantId);

    expect(soloStart).toThrow("At least 2 players are required to start");

    joinRoom(host.room.code, "Bob");
    const started = startGame(host.room.code, host.participantId);

    expect(started?.status).toBe("playing");
    expect(started?.round?.drawerId).toBe(host.participantId);
    expect(started?.round?.word).toBe("rocket");
    expect(started?.scores).toEqual({
      [host.participantId]: 0,
      [started?.participants[1].id ?? ""]: 0
    });
  });

  it("rejects non-host start attempts", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(() => startGame(host.room.code, guest?.participantId ?? "")).toThrow(
      "Only the host can perform this action"
    );
  });

  it("hides the secret word from guessers until result", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const playing = startGame(host.room.code, host.participantId);

    expect(playing).not.toBeNull();

    const drawerSnapshot = toRoomSnapshot(playing!, host.participantId);
    const guesserSnapshot = toRoomSnapshot(playing!, guest?.participantId);

    expect(drawerSnapshot.secretWord).toBe("rocket");
    expect(guesserSnapshot.secretWord).toBeNull();
    expect(guesserSnapshot.wordLength).toBe(6);
  });

  it("updates and clears drawing only for the drawer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    expect(() =>
      updateDrawing(host.room.code, guest?.participantId ?? "", "data:image/png;base64,abc")
    ).toThrow("Only the drawer can update the drawing");

    const drawn = updateDrawing(host.room.code, host.participantId, "data:image/png;base64,abc");
    expect(drawn?.round?.drawingDataUrl).toBe("data:image/png;base64,abc");

    const cleared = clearDrawing(host.room.code, host.participantId);
    expect(cleared?.round?.drawingDataUrl).toBeNull();
  });

  it("records guesses, scores correct guesses, and exposes result", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const incorrect = submitGuess(host.room.code, guest?.participantId ?? "", " pizza ");
    expect(incorrect?.status).toBe("playing");
    expect(incorrect?.round?.guesses[0]).toMatchObject({
      text: "pizza",
      correct: false,
      scoreDelta: 0
    });

    const result = submitGuess(host.room.code, guest?.participantId ?? "", "ROCKET");
    const resultSnapshot = toRoomSnapshot(result!, guest?.participantId);

    expect(result?.status).toBe("result");
    expect(result?.scores[guest?.participantId ?? ""]).toBe(100);
    expect(resultSnapshot.secretWord).toBe("rocket");
    expect(resultSnapshot.result?.word).toBe("rocket");
    expect(resultSnapshot.guesses).toHaveLength(2);
  });

  it("restarts from result with players preserved and round state cleared", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);
    submitGuess(host.room.code, guest?.participantId ?? "", "rocket");

    const restarted = restartGame(host.room.code, host.participantId);

    expect(restarted?.status).toBe("lobby");
    expect(restarted?.participants.map((participant) => participant.name)).toEqual(["Alice", "Bob"]);
    expect(restarted?.round).toBeNull();
    expect(restarted?.scores).toEqual({});
  });
});
