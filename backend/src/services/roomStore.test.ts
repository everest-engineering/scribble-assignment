import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, saveRoom, startRoom, toRoomSnapshot } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
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

  it("startRoom assigns the host as drawer and reveals the word only to the drawer", () => {
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

    const hostSnapshot = toRoomSnapshot(started.room, host.participantId);
    const guestSnapshot = toRoomSnapshot(started.room, joined!.participantId);

    expect(hostSnapshot.viewerIsHost).toBe(true);
    expect(hostSnapshot.viewerIsDrawer).toBe(true);
    expect(hostSnapshot.wordVisibility).toBe("visible");
    expect(hostSnapshot.secretWord).toBe(started.room.round?.secretWord);
    expect(hostSnapshot.canStartGame).toBe(false);

    expect(guestSnapshot.viewerIsHost).toBe(false);
    expect(guestSnapshot.viewerIsDrawer).toBe(false);
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

  it("starting one room does not affect other active rooms", () => {
    const firstRoom = createRoom("Alice");
    const secondRoom = createRoom("Cara");
    joinRoom(firstRoom.room.code, "Bob");

    const started = startRoom(firstRoom.room.code, firstRoom.participantId);

    expect(started.ok).toBe(true);

    const untouchedRoom = getRoom(secondRoom.room.code);
    expect(untouchedRoom?.status).toBe("lobby");
    expect(untouchedRoom?.participants).toHaveLength(1);
    expect(untouchedRoom?.round).toBeUndefined();
  });
});
