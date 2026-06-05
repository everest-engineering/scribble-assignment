import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDrawing,
  createRoom,
  getRoom,
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
    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("keeps participants isolated by room code", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Carol");

    joinRoom(firstRoom.room.code, "Bob");

    expect(getRoom(firstRoom.room.code)?.participants.map((participant) => participant.name)).toEqual(["Alice", "Bob"]);
    expect(getRoom(secondRoom.room.code)?.participants.map((participant) => participant.name)).toEqual(["Carol"]);
  });

  it("marks the snapshot viewer as host only for the host participant", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    expect(toRoomSnapshot(host.room, host.participantId).isHost).toBe(true);
    expect(toRoomSnapshot(host.room, guest!.participantId).isHost).toBe(false);
  });

  it("rejects start attempts from non-host participants", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    const result = startGame(host.room.code, guest!.participantId);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      statusCode: 403,
      message: "Only the host can start the game"
    });
  });

  it("requires at least 2 participants to start", () => {
    const host = createRoom("Alice");
    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({
      statusCode: 400,
      message: "At least 2 players are required to start"
    });
  });

  it("allows the host to start when at least 2 participants are present", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.room.status : null).toBe("playing");
  });

  it("assigns the first participant as drawer when the game starts", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.room.drawerParticipantId : null).toBe(host.participantId);
  });

  it("selects the first starter word deterministically when the game starts", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");

    const result = startGame(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.room.word : null).toBe("rocket");
  });

  it("shows drawer identity to all participants and the secret word only to the drawer", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    const result = startGame(host.room.code, host.participantId);
    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(result.room, host.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, guest!.participantId);
    const anonymousSnapshot = toRoomSnapshot(result.room);
    const unknownViewerSnapshot = toRoomSnapshot(result.room, "unknown");

    expect(drawerSnapshot.drawerParticipantId).toBe(host.participantId);
    expect(drawerSnapshot.drawerName).toBe("Alice");
    expect(drawerSnapshot.secretWord).toBe("rocket");
    expect(guesserSnapshot.drawerParticipantId).toBe(host.participantId);
    expect(guesserSnapshot.drawerName).toBe("Alice");
    expect(guesserSnapshot.secretWord).toBeNull();
    expect(anonymousSnapshot.secretWord).toBeNull();
    expect(unknownViewerSnapshot.secretWord).toBeNull();
  });

  it("does not expose drawer or secret word before the game starts", () => {
    const host = createRoom("Alice");

    const snapshot = toRoomSnapshot(host.room, host.participantId);

    expect(snapshot.drawerParticipantId).toBeNull();
    expect(snapshot.drawerName).toBeNull();
    expect(snapshot.secretWord).toBeNull();
  });

  it("initializes scores, drawing, and guesses when the game starts", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();

    const result = startGame(host.room.code, host.participantId);
    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const snapshot = toRoomSnapshot(result.room, host.participantId);

    expect(snapshot.scores).toEqual([
      { participantId: host.participantId, participantName: "Alice", score: 0 },
      { participantId: guest!.participantId, participantName: "Bob", score: 0 }
    ]);
    expect(snapshot.drawing).toEqual({ strokes: [] });
    expect(snapshot.guesses).toEqual([]);
  });

  it("allows the drawer to update and clear drawing state", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const drawing = { strokes: [{ points: [{ x: 12, y: 24 }] }] };
    const drawResult = updateDrawing(host.room.code, host.participantId, drawing);

    expect(drawResult.ok).toBe(true);
    expect(drawResult.ok ? drawResult.room.drawing : null).toEqual(drawing);

    const clearResult = clearDrawing(host.room.code, host.participantId);

    expect(clearResult.ok).toBe(true);
    expect(clearResult.ok ? clearResult.room.drawing : null).toEqual({ strokes: [] });
  });

  it("rejects drawing updates and clear attempts from non-drawers", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();
    startGame(host.room.code, host.participantId);

    const drawResult = updateDrawing(host.room.code, guest!.participantId, { strokes: [] });
    const clearResult = clearDrawing(host.room.code, guest!.participantId);

    expect(drawResult.ok).toBe(false);
    expect(drawResult).toMatchObject({ statusCode: 403, message: "Only the drawer can update the drawing" });
    expect(clearResult.ok).toBe(false);
    expect(clearResult).toMatchObject({ statusCode: 403, message: "Only the drawer can update the drawing" });
  });

  it("rejects drawing, clear, and guess actions before a round is active", () => {
    const host = createRoom("Alice");

    expect(updateDrawing(host.room.code, host.participantId, { strokes: [] })).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Round is not active"
    });
    expect(clearDrawing(host.room.code, host.participantId)).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Round is not active"
    });
    expect(submitGuess(host.room.code, host.participantId, "rocket")).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Round is not active"
    });
  });

  it("rejects guesses from the drawer and unknown participants", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startGame(host.room.code, host.participantId);

    const drawerGuess = submitGuess(host.room.code, host.participantId, "rocket");
    const unknownGuess = submitGuess(host.room.code, "unknown", "rocket");

    expect(drawerGuess).toMatchObject({
      ok: false,
      statusCode: 403,
      message: "The drawer cannot submit guesses"
    });
    expect(unknownGuess).toMatchObject({
      ok: false,
      statusCode: 403,
      message: "Participant is not in this room"
    });
  });

  it("trims guesses and rejects empty guesses without storing history", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();
    const startResult = startGame(host.room.code, host.participantId);
    expect(startResult.ok).toBe(true);

    const emptyGuess = submitGuess(host.room.code, guest!.participantId, "   ");
    const wrongGuess = submitGuess(host.room.code, guest!.participantId, "  castle  ");

    expect(emptyGuess).toMatchObject({ ok: false, statusCode: 400, message: "Guess is required" });
    expect(wrongGuess.ok).toBe(true);

    if (!wrongGuess.ok) {
      return;
    }

    expect(wrongGuess.room.guesses).toHaveLength(1);
    expect(wrongGuess.room.guesses?.[0]).toMatchObject({
      participantId: guest!.participantId,
      participantName: "Bob",
      text: "castle",
      isCorrect: false,
      scoreDelta: 0
    });
  });

  it("scores guesses deterministically, ends the round on correct guess, and exposes result history", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();
    startGame(host.room.code, host.participantId);

    const wrongGuess = submitGuess(host.room.code, guest!.participantId, "pizza");
    const correctGuess = submitGuess(host.room.code, guest!.participantId, " RoCkEt ");
    const repeatedCorrectGuess = submitGuess(host.room.code, guest!.participantId, "rocket");

    expect(wrongGuess.ok).toBe(true);
    expect(correctGuess.ok).toBe(true);
    expect(repeatedCorrectGuess).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Round is not active"
    });

    if (!correctGuess.ok) {
      return;
    }

    const snapshot = toRoomSnapshot(correctGuess.room, guest!.participantId);

    expect(snapshot.status).toBe("result");
    expect(snapshot.correctWord).toBe("rocket");
    expect(snapshot.secretWord).toBeNull();
    expect(snapshot.drawerParticipantId).toBe(host.participantId);
    expect(snapshot.drawerName).toBe("Alice");
    expect(snapshot.scores).toEqual([
      { participantId: host.participantId, participantName: "Alice", score: 0 },
      { participantId: guest!.participantId, participantName: "Bob", score: 100 }
    ]);
    expect(snapshot.guesses.map((guess) => ({
      text: guess.text,
      isCorrect: guess.isCorrect,
      scoreDelta: guess.scoreDelta
    }))).toEqual([
      { text: "pizza", isCorrect: false, scoreDelta: 0 },
      { text: "RoCkEt", isCorrect: true, scoreDelta: 100 }
    ]);
  });

  it("rejects drawing, clear, and guess actions in result state", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();
    startGame(host.room.code, host.participantId);
    const correctGuess = submitGuess(host.room.code, guest!.participantId, "rocket");
    expect(correctGuess.ok).toBe(true);

    expect(updateDrawing(host.room.code, host.participantId, { strokes: [] })).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Round is not active"
    });
    expect(clearDrawing(host.room.code, host.participantId)).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Round is not active"
    });
    expect(submitGuess(host.room.code, guest!.participantId, "rocket")).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Round is not active"
    });
  });

  it("rejects restart from non-hosts, unknown participants, and rooms outside result state", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();

    expect(restartGame(host.room.code, host.participantId)).toMatchObject({
      ok: false,
      statusCode: 400,
      message: "Room is not ready to restart"
    });

    startGame(host.room.code, host.participantId);
    submitGuess(host.room.code, guest!.participantId, "rocket");

    expect(restartGame(host.room.code, "unknown")).toMatchObject({
      ok: false,
      statusCode: 403,
      message: "Participant is not in this room"
    });
    expect(restartGame(host.room.code, guest!.participantId)).toMatchObject({
      ok: false,
      statusCode: 403,
      message: "Only the host can restart the room"
    });
    expect(restartGame("ZZZZ", host.participantId)).toMatchObject({
      ok: false,
      statusCode: 404,
      message: "Unable to load room"
    });
  });

  it("host restart preserves room identity and players while clearing round state", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    expect(guest).not.toBeNull();
    startGame(host.room.code, host.participantId);

    const drawing = { strokes: [{ points: [{ x: 12, y: 24 }, { x: 30, y: 42 }] }] };
    updateDrawing(host.room.code, host.participantId, drawing);
    const resultGuess = submitGuess(host.room.code, guest!.participantId, "rocket");
    expect(resultGuess.ok).toBe(true);

    const restartResult = restartGame(host.room.code, host.participantId);
    expect(restartResult.ok).toBe(true);

    if (!restartResult.ok) {
      return;
    }

    const snapshot = toRoomSnapshot(restartResult.room, host.participantId);

    expect(snapshot.code).toBe(host.room.code);
    expect(snapshot.status).toBe("lobby");
    expect(snapshot.hostParticipantId).toBe(host.participantId);
    expect(snapshot.participants.map((participant) => participant.id)).toEqual([
      host.participantId,
      guest!.participantId
    ]);
    expect(snapshot.participants.map((participant) => participant.name)).toEqual(["Alice", "Bob"]);
    expect(snapshot.drawerParticipantId).toBeNull();
    expect(snapshot.drawerName).toBeNull();
    expect(snapshot.secretWord).toBeNull();
    expect(snapshot.correctWord).toBeNull();
    expect(snapshot.drawing).toEqual({ strokes: [] });
    expect(snapshot.guesses).toEqual([]);
    expect(snapshot.scores).toEqual([
      { participantId: host.participantId, participantName: "Alice", score: 0 },
      { participantId: guest!.participantId, participantName: "Bob", score: 0 }
    ]);
  });
});
