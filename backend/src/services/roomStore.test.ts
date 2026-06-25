import { describe, expect, it } from "vitest";
import {
  addStroke,
  clearCanvas,
  createRoom,
  joinRoom,
  restartGame,
  selectWord,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code and hostId", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.room.hostId).toBe(result.participantId);
    expect(result.participantId).toBeDefined();
  });

  it("createRoom rejects empty player name", () => {
    expect(() => createRoom("   ")).toThrow("Player name is required");
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("startGame requires host and at least 2 players", () => {
    const host = createRoom("Host");
    expect(() => startGame(host.room.code, host.participantId)).toThrow(
      "At least 2 players are required to start"
    );

    const guest = joinRoom(host.room.code, "Guest");
    expect(guest).not.toBeNull();

    const started = startGame(host.room.code, host.participantId);
    expect(started.status).toBe("playing");
    expect(started.drawerId).toBe(host.participantId);
    expect(started.secretWord).toBe(selectWord(host.room.code));
  });

  it("toRoomSnapshot hides secret word from guessers during play", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const playing = startGame(host.room.code, host.participantId);
    const guestId = playing.participants.find((participant) => participant.name === "Guest")!.id;

    const drawerView = toRoomSnapshot(playing, host.participantId);
    const guestView = toRoomSnapshot(playing, guestId);

    expect(drawerView.secretWord).toBeDefined();
    expect(guestView.secretWord).toBeUndefined();
  });

  it("submitGuess scores correct guesses and ends the round", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const playing = startGame(host.room.code, host.participantId);
    const guestId = playing.participants.find((participant) => participant.name === "Guest")!.id;
    const word = playing.secretWord!;

    const afterGuess = submitGuess(host.room.code, guestId, word.toUpperCase());

    expect(afterGuess.status).toBe("result");
    expect(afterGuess.guesses).toHaveLength(1);
    expect(afterGuess.guesses[0].correct).toBe(true);
    expect(afterGuess.participants.find((participant) => participant.id === guestId)?.score).toBe(100);
  });

  it("addStroke and clearCanvas update drawing state for drawer", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    startGame(host.room.code, host.participantId);

    const withStroke = addStroke(host.room.code, host.participantId, {
      points: [
        { x: 0.1, y: 0.1 },
        { x: 0.2, y: 0.2 }
      ]
    });
    expect(withStroke.strokes).toHaveLength(1);

    const cleared = clearCanvas(host.room.code, host.participantId);
    expect(cleared.strokes).toHaveLength(0);
  });

  it("restartGame resets round state and preserves participants", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const playing = startGame(host.room.code, host.participantId);
    const guestParticipantId = playing.participants.find((participant) => participant.name === "Guest")!.id;
    submitGuess(host.room.code, guestParticipantId, playing.secretWord!);

    const restarted = restartGame(host.room.code, host.participantId);
    expect(restarted.status).toBe("lobby");
    expect(restarted.participants).toHaveLength(2);
    expect(restarted.strokes).toHaveLength(0);
    expect(restarted.guesses).toHaveLength(0);
    expect(restarted.secretWord).toBeUndefined();
    expect(restarted.participants.every((participant) => participant.score === 0)).toBe(true);
  });
});
