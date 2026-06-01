import { afterEach, describe, expect, it } from "vitest";
import type { Room } from "../models/game.js";
import {
  assignRoundOneRoles,
  clearAllRoomsForTests,
  createRoom,
  getRoomForParticipant,
  joinRoom,
  startGame,
  toRoomSnapshot,
  trimParticipantNames
} from "./roomStore.js";
import { RoomServiceError } from "./roomErrors.js";
import { selectRoundWord } from "./wordSelection.js";

afterEach(() => {
  clearAllRoomsForTests();
});

describe("roomStore", () => {
  it("createRoom assigns host and trims name", () => {
    const result = createRoom("  Alice  ");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(result.room.participants[0].name).toBe("Alice");
  });

  it("createRoom rejects empty name", () => {
    expect(() => createRoom("   ")).toThrow(RoomServiceError);
  });

  it("trimParticipantNames rejects whitespace-only roster names", () => {
    const room = {
      participants: [{ name: "   " }]
    } as Room;

    expect(() => trimParticipantNames(room)).toThrow(/Name is required/);
  });

  it("joinRoom is case-insensitive for room code", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code.toLowerCase(), "Guest");

    expect(guest.room.participants).toHaveLength(2);
  });

  it("joinRoom rejects unknown room", () => {
    expect(() => joinRoom("ZZZZ", "Bob")).toThrow(RoomServiceError);
  });

  it("joinRoom rejects when room is full", () => {
    const host = createRoom("Host");

    for (let index = 0; index < 9; index += 1) {
      joinRoom(host.room.code, `Guest${index}`);
    }

    expect(() => joinRoom(host.room.code, "OneTooMany")).toThrow(/Room is full/);
  });

  it("joinRoom rejects when game already started", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    startGame(host.room.code, host.participantId);

    expect(() => joinRoom(host.room.code, "Late")).toThrow(/Game already started/);
  });

  it("toRoomSnapshot exposes canStart only for host with two players", () => {
    const host = createRoom("Host");
    const alone = toRoomSnapshot(host.room, host.participantId);

    expect(alone.viewer?.canStart).toBe(false);

    const guest = joinRoom(host.room.code, "Guest");
    const ready = toRoomSnapshot(guest.room, host.participantId);

    expect(ready.viewer?.canStart).toBe(true);
    expect(toRoomSnapshot(guest.room, guest.participantId).viewer?.canStart).toBe(false);
  });

  it("getRoomForParticipant resumes participant without duplicating", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const refreshed = getRoomForParticipant(host.room.code, host.participantId);

    expect(refreshed.participants).toHaveLength(2);
  });

  it("startGame requires host and two players", () => {
    const host = createRoom("Host");

    expect(() => startGame(host.room.code, host.participantId)).toThrow(/two players/i);

    const guest = joinRoom(host.room.code, "Guest");

    expect(() => startGame(guest.room.code, guest.participantId)).toThrow(/Only the host/);

    const started = startGame(host.room.code, host.participantId);
    expect(started.status).toBe("drawing");
  });

  it("startGame assigns host as drawer for round one", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);

    expect(started.drawerParticipantId).toBe(host.participantId);
    expect(started.participants.find((entry) => entry.id === host.participantId)?.role).toBe(
      "drawer"
    );
    expect(started.participants.find((entry) => entry.id === guest.participantId)?.role).toBe(
      "guesser"
    );
  });

  it("assignRoundOneRoles uses earliest joiner when host absent", () => {
    const room = {
      code: "TEST",
      status: "lobby",
      hostParticipantId: "missing-host",
      participants: [
        {
          id: "first",
          name: "First",
          joinedAt: "2020-01-01T00:00:00.000Z",
          lastSeenAt: "2020-01-01T00:00:00.000Z"
        },
        {
          id: "second",
          name: "Second",
          joinedAt: "2020-01-02T00:00:00.000Z",
          lastSeenAt: "2020-01-02T00:00:00.000Z"
        }
      ],
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z"
    } as Room;

    assignRoundOneRoles(room);

    expect(room.drawerParticipantId).toBe("first");
  });

  it("startGame selects deterministic secret word", () => {
    const host = createRoom("Host");
    joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);

    expect(started.secretWord).toBe(selectRoundWord(started.code, 1));
  });

  it("toRoomSnapshot exposes secret word only to drawer viewer", () => {
    const host = createRoom("Host");
    const guest = joinRoom(host.room.code, "Guest");
    const started = startGame(host.room.code, host.participantId);

    const drawerView = toRoomSnapshot(started, host.participantId);
    const guesserView = toRoomSnapshot(started, guest.participantId);

    expect(drawerView.viewer?.secretWord).toBe(started.secretWord);
    expect(guesserView.viewer?.secretWord).toBeUndefined();
  });
});
