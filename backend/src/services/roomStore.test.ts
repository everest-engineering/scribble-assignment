import { beforeEach, describe, expect, it } from "vitest";
import {
  createRoom,
  clearCanvas,
  drawCanvas,
  getRoom,
  joinRoom,
  resetRooms,
  restartRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    resetRooms();
  });

  it("createRoom returns a host participant as the first room member", () => {
    const result = createRoom("Alice");

    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0]).toMatchObject({
      id: result.participantId,
      name: "Alice"
    });
    expect(result.room.status).toBe("lobby");
  });

  it("joinRoom keeps room membership isolated between rooms", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Bob");

    const joinedFirst = joinRoom(firstRoom.room.code, "Charlie");

    expect(joinedFirst).not.toBeNull();
    expect(joinedFirst?.room.participants).toHaveLength(2);
    expect(getRoom(secondRoom.room.code)?.participants).toHaveLength(1);
  });

  it("toRoomSnapshot includes the shared room state", () => {
    const created = createRoom("Alice");
    const snapshot = toRoomSnapshot(created.room, created.participantId);

    expect(snapshot.availableWords).toEqual(expect.arrayContaining(["rocket", "pizza"]));
    expect(snapshot.roles).toEqual(["drawer", "guesser"]);
    expect(snapshot.drawerParticipantId).toBeNull();
    expect(snapshot.roundPhase).toBeNull();
    expect(snapshot.canvasEvents).toEqual([]);
    expect(snapshot.guessHistory).toEqual([]);
    expect(snapshot.scores).toEqual({});
  });

  it("startRoom assigns the host as the drawer and stores a secret word", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");

    const started = startRoom(created.room.code, created.participantId, "pizza");

    expect(started?.status).toBe("game");
    expect(started?.round).toMatchObject({
      drawerParticipantId: created.participantId,
      secretWord: "pizza",
      phase: "active",
      endedAt: null,
      canvasEvents: [],
      guessHistory: [],
      scores: {
        [created.participantId]: 0,
        [created.room.participants[0].id]: 0
      }
    });
  });

  it("toRoomSnapshot only reveals the secret word to the drawer", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");

    const started = startRoom(created.room.code, created.participantId, "rocket");

    expect(started).not.toBeNull();

    const drawerSnapshot = toRoomSnapshot(started as NonNullable<typeof started>, created.participantId);
    const guesserSnapshot = toRoomSnapshot(started as NonNullable<typeof started>, joined?.participantId);

    expect(drawerSnapshot.drawerParticipantId).toBe(created.participantId);
    expect(drawerSnapshot.secretWord).toBe("rocket");
    expect(drawerSnapshot.roundPhase).toBe("active");
    expect(guesserSnapshot.drawerParticipantId).toBe(created.participantId);
    expect(guesserSnapshot.secretWord).toBeUndefined();
  });

  it("submitGuess ends the round on the first correct guess", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startRoom(created.room.code, created.participantId, "rocket");

    const guessed = submitGuess(created.room.code, joined?.participantId ?? "", "Rocket");

    expect(guessed?.round?.phase).toBe("ended");
    expect(guessed?.round?.endedAt).not.toBeNull();
    expect(toRoomSnapshot(guessed as NonNullable<typeof guessed>, created.participantId).secretWord).toBe("rocket");
    expect(() =>
      drawCanvas(created.room.code, created.participantId, {
        points: [{ x: 1, y: 1 }],
        color: "#111827",
        lineWidth: 4
      })
    ).toThrow("Round has ended");
    expect(() =>
      submitGuess(created.room.code, joined?.participantId ?? "", "pizza")
    ).toThrow("Round has ended");
  });

  it("drawCanvas stores a stroke only for the drawer", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startRoom(created.room.code, created.participantId, "rocket");

    const drawn = drawCanvas(created.room.code, created.participantId, {
      points: [
        { x: 10, y: 20 },
        { x: 20, y: 30 }
      ],
      color: "#111827",
      lineWidth: 4
    });

    expect(drawn?.round?.canvasEvents).toHaveLength(1);
    expect(() => drawCanvas(created.room.code, joined?.participantId ?? "", {
      points: [{ x: 1, y: 1 }],
      color: "#111827",
      lineWidth: 4
    })).toThrow("Only the drawer can perform this action");
  });

  it("clearCanvas resets the canvas history", () => {
    const created = createRoom("Alice");
    joinRoom(created.room.code, "Bob");
    startRoom(created.room.code, created.participantId, "rocket");
    drawCanvas(created.room.code, created.participantId, {
      points: [{ x: 10, y: 20 }],
      color: "#111827",
      lineWidth: 4
    });

    const cleared = clearCanvas(created.room.code, created.participantId);

    expect(cleared?.round?.canvasEvents).toEqual([]);
  });

  it("submitGuess trims, compares case-insensitively, and updates scores", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startRoom(created.room.code, created.participantId, "rocket");

    const guessed = submitGuess(created.room.code, joined?.participantId ?? "", "  RoCkEt  ");

    expect(guessed?.round?.guessHistory).toHaveLength(1);
    expect(guessed?.round?.guessHistory[0]).toMatchObject({
      participantId: joined?.participantId,
      rawText: "RoCkEt",
      normalizedText: "rocket",
      isCorrect: true,
      pointsAwarded: 100
    });
    expect(guessed?.round?.scores[joined?.participantId ?? ""]).toBe(100);
  });

  it("restartRoom returns the room to the lobby and preserves participants", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startRoom(created.room.code, created.participantId, "rocket");
    submitGuess(created.room.code, joined?.participantId ?? "", "Rocket");

    const restarted = restartRoom(created.room.code, created.participantId);

    expect(restarted?.status).toBe("lobby");
    expect(restarted?.round).toBeNull();
    expect(restarted?.participants).toHaveLength(2);
    expect(restarted?.participants[0]?.id).toBe(created.participantId);
    expect(restarted?.participants[1]?.id).toBe(joined?.participantId);
  });

  it("restartRoom rejects non-host players", () => {
    const created = createRoom("Alice");
    const joined = joinRoom(created.room.code, "Bob");
    startRoom(created.room.code, created.participantId, "rocket");
    submitGuess(created.room.code, joined?.participantId ?? "", "Rocket");

    expect(() => restartRoom(created.room.code, joined?.participantId ?? "")).toThrow(
      "Only the host can restart the game"
    );
  });

});
