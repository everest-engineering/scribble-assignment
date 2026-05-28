import { describe, expect, it } from "vitest";
import {
  clearDrawing,
  createRoom,
  endRound,
  joinRoom,
  restartRoom,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
} from "./roomStore.js";

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

  it("startGame assigns the host as drawer and masks the secret word for guessers", () => {
    const hostSession = createRoom("Alice");
    const guestSession = joinRoom(hostSession.room.code, "Bob");

    expect(guestSession).not.toBeNull();

    const result = startGame(hostSession.room.code, hostSession.participantId);

    expect(result.ok).toBe(true);

    if (!result.ok || !guestSession) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(result.room, hostSession.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, guestSession.participantId);

    expect(drawerSnapshot.status).toBe("game");
    expect(drawerSnapshot.drawerId).toBe(hostSession.participantId);
    expect(drawerSnapshot.secretWord).toBeTruthy();
    expect(guesserSnapshot.secretWord).toBeNull();
  });

  it("allows only the drawer to update and clear the drawing", () => {
    const hostSession = createRoom("Alice");
    const guestSession = joinRoom(hostSession.room.code, "Bob");

    expect(guestSession).not.toBeNull();

    const startResult = startGame(hostSession.room.code, hostSession.participantId);

    expect(startResult.ok).toBe(true);

    if (!startResult.ok || !guestSession) {
      return;
    }

    const drawing = [
      {
        id: "stroke-1",
        color: "#111827",
        size: 4,
        points: [
          { x: 0.1, y: 0.2 },
          { x: 0.3, y: 0.4 }
        ]
      }
    ];
    const rejected = updateDrawing(hostSession.room.code, guestSession.participantId, drawing);
    const accepted = updateDrawing(hostSession.room.code, hostSession.participantId, drawing);

    expect(rejected.ok).toBe(false);
    expect(accepted.ok).toBe(true);

    if (!accepted.ok) {
      return;
    }

    expect(accepted.room.drawing).toEqual(drawing);

    const cleared = clearDrawing(hostSession.room.code, hostSession.participantId);

    expect(cleared.ok).toBe(true);

    if (!cleared.ok) {
      return;
    }

    expect(cleared.room.drawing).toEqual([]);
  });

  it("records guesses, scores correct guesses case-insensitively, and prevents repeat score awards", () => {
    const hostSession = createRoom("Alice");
    const guestSession = joinRoom(hostSession.room.code, "Bob");

    expect(guestSession).not.toBeNull();

    const startResult = startGame(hostSession.room.code, hostSession.participantId);

    expect(startResult.ok).toBe(true);

    if (!startResult.ok || !guestSession) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(startResult.room, hostSession.participantId);
    const secretWord = drawerSnapshot.secretWord;

    expect(secretWord).toBeTruthy();

    if (!secretWord) {
      return;
    }

    const drawerGuess = submitGuess(hostSession.room.code, hostSession.participantId, secretWord);
    const blankGuess = submitGuess(hostSession.room.code, guestSession.participantId, "   ");
    const incorrectGuess = submitGuess(hostSession.room.code, guestSession.participantId, "not it");
    const correctGuess = submitGuess(hostSession.room.code, guestSession.participantId, secretWord.toUpperCase());
    const repeatGuess = submitGuess(hostSession.room.code, guestSession.participantId, secretWord);

    expect(drawerGuess.ok).toBe(false);
    expect(blankGuess.ok).toBe(false);
    expect(incorrectGuess.ok).toBe(true);
    expect(correctGuess.ok).toBe(true);
    expect(repeatGuess.ok).toBe(true);

    if (!incorrectGuess.ok || !correctGuess.ok || !repeatGuess.ok) {
      return;
    }

    expect(incorrectGuess.room.guesses.at(-1)).toMatchObject({
      text: "not it",
      isCorrect: false,
      pointsAwarded: 0
    });
    expect(correctGuess.room.guesses.at(-1)).toMatchObject({
      isCorrect: true,
      pointsAwarded: 100
    });
    expect(repeatGuess.room.guesses.at(-1)).toMatchObject({
      isCorrect: true,
      pointsAwarded: 0
    });
    expect(repeatGuess.room.scores[guestSession.participantId]).toBe(100);
  });

  it("ends the round for the host and reveals the secret word to guessers in results", () => {
    const hostSession = createRoom("Alice");
    const guestSession = joinRoom(hostSession.room.code, "Bob");

    expect(guestSession).not.toBeNull();

    const startResult = startGame(hostSession.room.code, hostSession.participantId);

    expect(startResult.ok).toBe(true);

    if (!startResult.ok || !guestSession) {
      return;
    }

    const secretWord = toRoomSnapshot(startResult.room, hostSession.participantId).secretWord;

    expect(secretWord).toBeTruthy();

    if (!secretWord) {
      return;
    }

    const nonHostEnd = endRound(hostSession.room.code, guestSession.participantId);
    const hostEnd = endRound(hostSession.room.code, hostSession.participantId);

    expect(nonHostEnd.ok).toBe(false);
    expect(hostEnd.ok).toBe(true);

    if (!hostEnd.ok) {
      return;
    }

    const guesserResultSnapshot = toRoomSnapshot(hostEnd.room, guestSession.participantId);

    expect(guesserResultSnapshot.status).toBe("results");
    expect(guesserResultSnapshot.secretWord).toBe(secretWord);
  });

  it("restarts from results with participants preserved and round state cleared", () => {
    const hostSession = createRoom("Alice");
    const guestSession = joinRoom(hostSession.room.code, "Bob");

    expect(guestSession).not.toBeNull();

    const startResult = startGame(hostSession.room.code, hostSession.participantId);

    expect(startResult.ok).toBe(true);

    if (!startResult.ok || !guestSession) {
      return;
    }

    const secretWord = toRoomSnapshot(startResult.room, hostSession.participantId).secretWord;

    expect(secretWord).toBeTruthy();

    if (!secretWord) {
      return;
    }

    submitGuess(hostSession.room.code, guestSession.participantId, secretWord);
    updateDrawing(hostSession.room.code, hostSession.participantId, [
      {
        id: "stroke-1",
        color: "#111827",
        size: 4,
        points: [{ x: 0.1, y: 0.2 }]
      }
    ]);

    const endResult = endRound(hostSession.room.code, hostSession.participantId);

    expect(endResult.ok).toBe(true);

    if (!endResult.ok) {
      return;
    }

    const nonHostRestart = restartRoom(hostSession.room.code, guestSession.participantId);
    const hostRestart = restartRoom(hostSession.room.code, hostSession.participantId);

    expect(nonHostRestart.ok).toBe(false);
    expect(hostRestart.ok).toBe(true);

    if (!hostRestart.ok) {
      return;
    }

    expect(hostRestart.room.status).toBe("lobby");
    expect(hostRestart.room.participants.map((participant) => participant.id)).toEqual([
      hostSession.participantId,
      guestSession.participantId
    ]);
    expect(hostRestart.room.hostId).toBe(hostSession.participantId);
    expect(hostRestart.room.drawerId).toBeNull();
    expect(hostRestart.room.secretWord).toBeNull();
    expect(hostRestart.room.drawing).toEqual([]);
    expect(hostRestart.room.guesses).toEqual([]);
    expect(hostRestart.room.scores).toEqual({
      [hostSession.participantId]: 0,
      [guestSession.participantId]: 0
    });
  });
});
