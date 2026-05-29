import { beforeEach, describe, expect, it } from "vitest";
import { clearRooms, createRoom, getRoom, joinRoom, saveRoom, selectSecretWord, startRoom, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  beforeEach(() => {
    clearRooms();
  });

  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom assigns the creator as host in the room snapshot", () => {
    const result = createRoom("Alice");
    const snapshot = toRoomSnapshot(result.room, result.participantId);

    expect(result.room.hostParticipantId).toBe(result.participantId);
    expect(snapshot.hostParticipantId).toBe(result.participantId);
    expect(snapshot.viewerParticipantId).toBe(result.participantId);
    expect(snapshot.isHost).toBe(true);
    expect(snapshot.canStart).toBe(false);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  it("joinRoom normalizes room codes and preserves room isolation", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Charlie");
    const joined = joinRoom(` ${firstRoom.room.code.toLowerCase()} `, "Bob");

    expect(joined?.room.code).toBe(firstRoom.room.code);
    expect(joined?.room.participants.map((participant) => participant.name)).toEqual(["Alice", "Bob"]);
    expect(getRoom(secondRoom.room.code)?.participants.map((participant) => participant.name)).toEqual(["Charlie"]);
  });

  it("joinRoom does not mutate rooms for invalid codes", () => {
    const room = createRoom("Alice");
    const result = joinRoom("BAD", "Bob");

    expect(result).toBeNull();
    expect(getRoom(room.room.code)?.participants).toHaveLength(1);
  });

  it("joinRoom rejects rooms that are no longer in lobby state", () => {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");

    expect(bob).not.toBeNull();
    const started = startRoom(room.room.code, room.participantId);

    expect(started.ok).toBe(true);
    expect(joinRoom(room.room.code, "Charlie")).toBeNull();
  });

  it("startRoom rejects host start attempts with fewer than two players", () => {
    const room = createRoom("Alice");
    const result = startRoom(room.room.code, room.participantId);

    expect(result).toEqual({
      ok: false,
      statusCode: 400,
      message: "At least 2 players are required to start"
    });
    expect(getRoom(room.room.code)?.status).toBe("lobby");
  });

  it("startRoom rejects non-host start attempts", () => {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");

    expect(bob).not.toBeNull();
    const result = startRoom(room.room.code, bob?.participantId ?? "");

    expect(result).toEqual({
      ok: false,
      statusCode: 403,
      message: "Only the host can start the game"
    });
    expect(getRoom(room.room.code)?.status).toBe("lobby");
  });

  it("startRoom transitions only the host room when at least two players are present", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Charlie");
    joinRoom(firstRoom.room.code, "Bob");

    const result = startRoom(firstRoom.room.code, firstRoom.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.status).toBe("playing");
    expect(getRoom(firstRoom.room.code)?.status).toBe("playing");
    expect(getRoom(secondRoom.room.code)?.status).toBe("lobby");
  });

  it("startRoom assigns the host as first drawer", () => {
    const room = createRoom("Alice");
    joinRoom(room.room.code, "Bob");

    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.currentRound?.drawerParticipantId).toBe(room.participantId);
    expect(result.ok && result.room.currentRound?.roundNumber).toBe(1);
  });

  it("startRoom falls back to earliest joined player when host reference is stale", () => {
    const room = createRoom("Alice");
    joinRoom(room.room.code, "Bob");
    const staleHostRoom = getRoom(room.room.code);

    expect(staleHostRoom).not.toBeNull();
    if (!staleHostRoom) {
      return;
    }

    staleHostRoom.hostParticipantId = "missing-host";
    saveRoom(staleHostRoom);

    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.currentRound?.drawerParticipantId).toBe(room.participantId);
  });

  it("selectSecretWord is deterministic and returns null for empty word lists", () => {
    expect(selectSecretWord("ABCD", ["rocket", "pizza", "castle"])).toBe(
      selectSecretWord("ABCD", ["rocket", "pizza", "castle"])
    );
    expect(selectSecretWord("ABCD", [])).toBeNull();
  });

  it("startRoom stores the selected secret word on the current round", () => {
    const room = createRoom("Alice");
    joinRoom(room.room.code, "Bob");
    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    expect(result.ok && result.room.currentRound?.secretWord).toBe(selectSecretWord(room.room.code));
    expect(getRoom(room.room.code)?.currentRound?.secretWord).toBe(selectSecretWord(room.room.code));
  });

  it("toRoomSnapshot includes secretWord only for the drawer", () => {
    const room = createRoom("Alice");
    const bob = joinRoom(room.room.code, "Bob");
    const result = startRoom(room.room.code, room.participantId);

    expect(result.ok).toBe(true);
    if (!result.ok || !bob) {
      return;
    }

    const drawerSnapshot = toRoomSnapshot(result.room, room.participantId);
    const guesserSnapshot = toRoomSnapshot(result.room, bob.participantId);
    const unknownSnapshot = toRoomSnapshot(result.room, "missing-player");

    expect(drawerSnapshot.isDrawer).toBe(true);
    expect(drawerSnapshot.viewerRole).toBe("drawer");
    expect(drawerSnapshot.secretWord).toBe(result.room.currentRound?.secretWord);
    expect(guesserSnapshot.isDrawer).toBe(false);
    expect(guesserSnapshot.viewerRole).toBe("guesser");
    expect("secretWord" in guesserSnapshot).toBe(false);
    expect("secretWord" in unknownSnapshot).toBe(false);
  });
});
