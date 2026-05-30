import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDrawing,
  clearRoomsForTest,
  createRoom,
  getRoom,
  joinRoom,
  startGame,
  submitGuess,
  restartGame,
  toRoomSnapshot,
  updateDrawing
} from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    clearRoomsForTest();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("joinRoom returns the room when the code is uppercased and valid", () => {
    const { room } = createRoom("Carol");
    const result = joinRoom(room.code.toLowerCase(), "Dave");

    expect(result).not.toBeNull();
    expect(result?.room.participants.some((participant) => participant.name === "Dave")).toBe(true);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("getRoom can retrieve a created room by code", () => {
    const { room } = createRoom("Eve");
    const loaded = getRoom(room.code);

    expect(loaded).not.toBeNull();
    expect(loaded?.code).toBe(room.code);
  });

  it("keeps participants isolated across rooms", () => {
    const first = createRoom("First Host");
    const second = createRoom("Second Host");

    joinRoom(first.room.code, "First Guest");
    joinRoom(second.room.code, "Second Guest");

    expect(getRoom(first.room.code)?.participants.map((participant) => participant.name)).toEqual([
      "First Host",
      "First Guest"
    ]);
    expect(getRoom(second.room.code)?.participants.map((participant) => participant.name)).toEqual([
      "Second Host",
      "Second Guest"
    ]);
  });

  it("allows only the host to start when at least two players are present", () => {
    const { room, participantId: hostId } = createRoom("Host");

    expect(startGame(room.code, hostId)).toEqual({
      ok: false,
      reason: "not-enough-players"
    });

    const guest = joinRoom(room.code, "Guest");

    expect(guest).not.toBeNull();
    expect(startGame(room.code, guest!.participantId)).toEqual({
      ok: false,
      reason: "not-host"
    });

    const started = startGame(room.code, hostId);

    expect(started.ok).toBe(true);
    if (started.ok) {
      expect(started.room.status).toBe("playing");
    }
  });

  it("reveals the secret word only to the drawer during play", () => {
    const { room, participantId: hostId } = createRoom("Host");
    const guest = joinRoom(room.code, "Guest");
    const started = startGame(room.code, hostId);

    expect(started.ok).toBe(true);
    if (!started.ok || !guest) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(started.room, hostId);
    const guesserSnapshot = toRoomSnapshot(started.room, guest.participantId);

    expect(drawerSnapshot.secretWord).toBeTruthy();
    expect(guesserSnapshot.secretWord).toBeNull();
  });

  it("allows only the drawer to update and clear drawing state", () => {
    const { room, participantId: hostId } = createRoom("Host");
    const guest = joinRoom(room.code, "Guest");
    const started = startGame(room.code, hostId);

    expect(started.ok).toBe(true);
    if (!started.ok || !guest) {
      return;
    }

    expect(updateDrawing(room.code, guest.participantId, { paths: [] })).toEqual({
      ok: false,
      reason: "not-drawer"
    });

    const drawing = {
      paths: [
        {
          color: "#111827",
          width: 4,
          points: [
            { x: 1, y: 2 },
            { x: 3, y: 4 }
          ]
        }
      ]
    };
    const updated = updateDrawing(room.code, hostId, drawing);

    expect(updated.ok).toBe(true);
    if (updated.ok) {
      expect(updated.room.round?.drawing.paths).toHaveLength(1);
    }

    const cleared = clearDrawing(room.code, hostId);

    expect(cleared.ok).toBe(true);
    if (cleared.ok) {
      expect(cleared.room.round?.drawing.paths).toHaveLength(0);
    }
  });

  it("records guesses, scores a correct guess deterministically, and moves to results", () => {
    const { room, participantId: hostId } = createRoom("Host");
    const guest = joinRoom(room.code, "Guest");
    const started = startGame(room.code, hostId);

    expect(started.ok).toBe(true);
    if (!started.ok || !guest) {
      return;
    }

    expect(submitGuess(room.code, hostId, "rocket")).toEqual({
      ok: false,
      reason: "drawer-cannot-guess"
    });

    const wrong = submitGuess(room.code, guest.participantId, "pizza");

    expect(wrong.ok).toBe(true);
    if (wrong.ok) {
      expect(wrong.room.status).toBe("playing");
      expect(wrong.room.round?.guesses[0].isCorrect).toBe(false);
    }

    const correct = submitGuess(room.code, guest.participantId, "rocket");

    expect(correct.ok).toBe(true);
    if (correct.ok) {
      expect(correct.room.status).toBe("results");
      expect(correct.room.round?.scores[guest.participantId]).toBe(100);
      expect(correct.room.round?.result?.winnerId).toBe(guest.participantId);
      expect(toRoomSnapshot(correct.room, guest.participantId).secretWord).toBe("rocket");
    }
  });

  it("lets only the host restart results back to a clean lobby with players preserved", () => {
    const { room, participantId: hostId } = createRoom("Host");
    const guest = joinRoom(room.code, "Guest");
    startGame(room.code, hostId);

    expect(guest).not.toBeNull();
    if (!guest) {
      return;
    }

    const result = submitGuess(room.code, guest.participantId, "rocket");
    expect(result.ok).toBe(true);

    expect(restartGame(room.code, guest.participantId)).toEqual({
      ok: false,
      reason: "not-host"
    });

    const restarted = restartGame(room.code, hostId);

    expect(restarted.ok).toBe(true);
    if (restarted.ok) {
      expect(restarted.room.status).toBe("lobby");
      expect(restarted.room.round).toBeNull();
      expect(restarted.room.participants.map((participant) => participant.name)).toEqual(["Host", "Guest"]);
    }
  });
});
