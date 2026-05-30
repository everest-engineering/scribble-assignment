import { describe, expect, it } from "vitest";
import {
  addDrawingStroke,
  clearRoomCanvas,
  createRoom,
  getRoom,
  joinRoom,
  saveRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.participants[0].score).toBe(0);
    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("createRoom stores a trimmed player name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom stores a trimmed player name", () => {
    const host = createRoom("Alice");
    const joined = joinRoom(host.room.code, "  Bob  ");

    expect(joined).not.toBeNull();
    expect(joined?.room.participants.at(-1)?.name).toBe("Bob");
    expect(joined?.room.participants.at(-1)?.score).toBe(0);
  });

  it("joinRoom updates only the targeted room and returns a new room session", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Cara");

    const joined = joinRoom(firstRoom.room.code, "Bob");

    expect(joined).not.toBeNull();
    expect(joined?.room.code).toBe(firstRoom.room.code);
    expect(joined?.room.participants).toHaveLength(2);

    const untouchedRoom = getRoom(secondRoom.room.code);
    expect(untouchedRoom?.participants).toHaveLength(1);
    expect(untouchedRoom?.participants[0].name).toBe("Cara");
  });

  it("toRoomSnapshot exposes host-aware start metadata", () => {
    const result = createRoom("Alice");

    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(snapshot.hostParticipantId).toBe(result.participantId);
    expect(snapshot.viewerIsHost).toBe(true);
    expect(snapshot.viewerIsDrawer).toBe(false);
    expect(snapshot.viewerCanDraw).toBe(false);
    expect(snapshot.viewerCanGuess).toBe(false);
    expect(snapshot.canStartGame).toBe(false);
    expect(snapshot.minimumPlayersToStart).toBe(2);
  });

  it("toRoomSnapshot enables start for the host once a second player joins but not for the guest", () => {
    const host = createRoom("Alice");
    const joined = joinRoom(host.room.code, "Bob");

    expect(joined).not.toBeNull();

    const updatedRoom = getRoom(host.room.code);
    expect(updatedRoom).not.toBeNull();

    const hostSnapshot = toRoomSnapshot(updatedRoom!, host.participantId);
    const guestSnapshot = toRoomSnapshot(updatedRoom!, joined!.participantId);

    expect(hostSnapshot.canStartGame).toBe(true);
    expect(hostSnapshot.viewerIsHost).toBe(true);
    expect(guestSnapshot.canStartGame).toBe(false);
    expect(guestSnapshot.viewerIsHost).toBe(false);
  });

  it("startRoom rejects the host when fewer than two players are present", () => {
    const result = createRoom("Alice");

    const started = startRoom(result.room.code, result.participantId);

    expect(started).toEqual({
      ok: false,
      reason: "conflict",
      message: "At least 2 players are required to start the game"
    });
  });

  it("startRoom rejects non-host participants", () => {
    const result = createRoom("Alice");
    const joined = joinRoom(result.room.code, "Bob");

    expect(joined).not.toBeNull();

    const started = startRoom(result.room.code, joined!.participantId);

    expect(started).toEqual({
      ok: false,
      reason: "forbidden",
      message: "Only the host can start the game"
    });
  });

  it("startRoom assigns the host as drawer and initializes Scenario 3 round state", () => {
    const host = createRoom("Alice");
    const joined = joinRoom(host.room.code, "Bob");

    expect(joined).not.toBeNull();

    const started = startRoom(host.room.code, host.participantId);

    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    expect(started.room.status).toBe("playing");
    expect(started.room.round?.drawerParticipantId).toBe(host.participantId);
    expect(started.room.round?.secretWord).toBeDefined();
    expect(started.room.round?.canvas.strokes).toHaveLength(0);
    expect(started.room.round?.guessHistory).toHaveLength(0);

    const hostSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guestSnapshot = toRoomSnapshot(started.room, joined!.participantId);

    expect(hostSnapshot.viewerIsHost).toBe(true);
    expect(hostSnapshot.viewerIsDrawer).toBe(true);
    expect(hostSnapshot.viewerCanDraw).toBe(true);
    expect(hostSnapshot.viewerCanGuess).toBe(false);
    expect(hostSnapshot.wordVisibility).toBe("visible");
    expect(hostSnapshot.secretWord).toBe(started.room.round?.secretWord);
    expect(hostSnapshot.guessHistory).toEqual([]);

    expect(guestSnapshot.viewerIsHost).toBe(false);
    expect(guestSnapshot.viewerIsDrawer).toBe(false);
    expect(guestSnapshot.viewerCanDraw).toBe(false);
    expect(guestSnapshot.viewerCanGuess).toBe(true);
    expect(guestSnapshot.drawerParticipantId).toBe(host.participantId);
    expect(guestSnapshot.wordVisibility).toBe("hidden");
    expect(guestSnapshot.secretWord).toBeUndefined();
  });

  it("startRoom falls back to the first participant when the host record is unusable", () => {
    const host = createRoom("Alice");
    const joined = joinRoom(host.room.code, "Bob");
    const third = joinRoom(host.room.code, "Cara");

    expect(joined).not.toBeNull();
    expect(third).not.toBeNull();

    const degradedRoom = getRoom(host.room.code);
    expect(degradedRoom).not.toBeNull();

    degradedRoom!.participants = degradedRoom!.participants.filter(
      (participant) => participant.id !== host.participantId
    );
    saveRoom(degradedRoom!);

    const started = startRoom(host.room.code, host.participantId);

    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    expect(started.room.round?.drawerParticipantId).toBe(joined!.participantId);
  });

  it("startRoom selects the same secret word for the same ordered participant names", () => {
    const firstRun = createRoom("Alice");
    joinRoom(firstRun.room.code, "Bob");

    const secondRun = createRoom("Alice");
    joinRoom(secondRun.room.code, "Bob");

    const firstStarted = startRoom(firstRun.room.code, firstRun.participantId);
    const secondStarted = startRoom(secondRun.room.code, secondRun.participantId);

    expect(firstStarted.ok).toBe(true);
    expect(secondStarted.ok).toBe(true);

    if (!firstStarted.ok || !secondStarted.ok) {
      return;
    }

    expect(firstStarted.room.round?.secretWord).toBe(secondStarted.room.round?.secretWord);
  });

  it("addDrawingStroke rejects non-drawer participants", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    startRoom(host.room.code, host.participantId);

    const result = addDrawingStroke(host.room.code, guest!.participantId, [{ x: 0.2, y: 0.3 }]);

    expect(result).toEqual({
      ok: false,
      reason: "forbidden",
      message: "Only the drawer can update the canvas"
    });
  });

  it("addDrawingStroke appends a stroke that all viewers can see", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();
    startRoom(host.room.code, host.participantId);

    const result = addDrawingStroke(host.room.code, host.participantId, [
      { x: 0.1, y: 0.1 },
      { x: 0.4, y: 0.4 }
    ]);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.round?.canvas.strokes).toHaveLength(1);
    expect(result.room.round?.canvas.strokes[0].points).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.4, y: 0.4 }
    ]);

    const guestSnapshot = toRoomSnapshot(result.room, guest!.participantId);
    expect(guestSnapshot.canvas?.strokes).toHaveLength(1);
  });

  it("clearRoomCanvas resets the stored strokes for the room", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code, host.participantId);
    addDrawingStroke(host.room.code, host.participantId, [{ x: 0.5, y: 0.5 }]);

    const result = clearRoomCanvas(host.room.code, host.participantId);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.round?.canvas.strokes).toEqual([]);
    expect(result.room.round?.canvas.clearedAt).toBeDefined();
  });

  it("submitGuess rejects drawer submissions", () => {
    const host = createRoom("Alice");
    joinRoom(host.room.code, "Bob");
    startRoom(host.room.code, host.participantId);

    const result = submitGuess(host.room.code, host.participantId, "rocket");

    expect(result).toEqual({
      ok: false,
      reason: "forbidden",
      message: "Drawer cannot submit guesses"
    });
  });

  it("submitGuess trims guesses, matches case-insensitively, and awards 100 points for correct guesses", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");

    expect(guest).not.toBeNull();

    const started = startRoom(host.room.code, host.participantId);
    expect(started.ok).toBe(true);
    if (!started.ok) {
      return;
    }

    const secretWord = started.room.round!.secretWord;
    const result = submitGuess(host.room.code, guest!.participantId, `  ${secretWord.toUpperCase()}  `);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.room.round?.guessHistory).toHaveLength(1);
    expect(result.room.round?.guessHistory[0].guess).toBe(secretWord.toUpperCase());
    expect(result.room.round?.guessHistory[0].isCorrect).toBe(true);
    expect(result.room.round?.guessHistory[0].scoreAwarded).toBe(100);

    const updatedGuest = result.room.participants.find((participant) => participant.id === guest!.participantId);
    expect(updatedGuest?.score).toBe(100);

    const guestSnapshot = toRoomSnapshot(result.room, guest!.participantId);
    expect(guestSnapshot.guessHistory?.[0].scoreAwarded).toBe(100);
  });

  it("submitGuess awards 0 points for incorrect guesses and preserves history order", () => {
    const host = createRoom("Alice");
    const guest = joinRoom(host.room.code, "Bob");
    const third = joinRoom(host.room.code, "Cara");

    expect(guest).not.toBeNull();
    expect(third).not.toBeNull();

    startRoom(host.room.code, host.participantId);

    const firstGuess = submitGuess(host.room.code, guest!.participantId, "wrong guess");
    const secondGuess = submitGuess(host.room.code, third!.participantId, "another miss");

    expect(firstGuess.ok).toBe(true);
    expect(secondGuess.ok).toBe(true);

    if (!secondGuess.ok) {
      return;
    }

    expect(secondGuess.room.round?.guessHistory).toHaveLength(2);
    expect(secondGuess.room.round?.guessHistory[0].participantId).toBe(guest!.participantId);
    expect(secondGuess.room.round?.guessHistory[1].participantId).toBe(third!.participantId);
    expect(secondGuess.room.round?.guessHistory[0].scoreAwarded).toBe(0);
    expect(secondGuess.room.round?.guessHistory[1].scoreAwarded).toBe(0);

    const guestParticipant = secondGuess.room.participants.find(
      (participant) => participant.id === guest!.participantId
    );
    const thirdParticipant = secondGuess.room.participants.find(
      (participant) => participant.id === third!.participantId
    );

    expect(guestParticipant?.score).toBe(0);
    expect(thirdParticipant?.score).toBe(0);
  });

  it("Scenario 3 drawing and guesses stay isolated per room", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Cara");
    const firstGuest = joinRoom(firstRoom.room.code, "Bob");
    const secondGuest = joinRoom(secondRoom.room.code, "Drew");

    expect(firstGuest).not.toBeNull();
    expect(secondGuest).not.toBeNull();

    startRoom(firstRoom.room.code, firstRoom.participantId);
    startRoom(secondRoom.room.code, secondRoom.participantId);

    addDrawingStroke(firstRoom.room.code, firstRoom.participantId, [{ x: 0.2, y: 0.2 }]);
    submitGuess(firstRoom.room.code, firstGuest!.participantId, "miss");

    const untouchedRoom = getRoom(secondRoom.room.code);
    expect(untouchedRoom?.round?.canvas.strokes).toHaveLength(0);
    expect(untouchedRoom?.round?.guessHistory).toHaveLength(0);
    expect(untouchedRoom?.participants.every((participant) => participant.score === 0)).toBe(true);
  });
});
