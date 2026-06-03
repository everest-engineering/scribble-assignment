import { describe, expect, it } from "vitest";
import {
  createRoom,
  joinRoom,
  MAX_PARTICIPANTS,
  normalizePlayerName,
  pickWord,
  PlayerNameValidationError,
  RoomCapacityError,
  startRound,
  StartInsufficientPlayersError,
  StartInvalidStateError,
  StartNotHostError,
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
});
