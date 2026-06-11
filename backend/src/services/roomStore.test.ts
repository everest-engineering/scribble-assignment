import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, leaveRoom, startRoom } from "./roomStore.js";
import { STARTER_WORDS } from "../seed/starterData.js";

function wordIndex(code: string): number {
  return code.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % 5;
}

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

  describe("startRoom", () => {
    it("assigns drawer role to the host who started the game", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const guestId = joinRoom(room.code, "Bob")!.participantId;

      const started = startRoom(room.code, hostId);

      expect(started).not.toBeNull();
      expect(started!.status).toBe("playing");
      const host = started!.participants.find((p) => p.id === hostId);
      expect(host?.role).toBe("drawer");
      const guest = started!.participants.find((p) => p.id === guestId);
      expect(guest?.role).toBe("guesser");
    });

    it("assigns drawer role with 3 participants", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      joinRoom(room.code, "Charlie");

      const started = startRoom(room.code, hostId);

      const host = started!.participants.find((p) => p.id === hostId);
      expect(host?.role).toBe("drawer");
      const guessers = started!.participants.filter((p) => p.id !== hostId);
      expect(guessers).toHaveLength(2);
      guessers.forEach((g) => expect(g.role).toBe("guesser"));
    });

    it("assigns drawer role with 4 participants", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      joinRoom(room.code, "Charlie");
      joinRoom(room.code, "Diana");

      const started = startRoom(room.code, hostId);

      const host = started!.participants.find((p) => p.id === hostId);
      expect(host?.role).toBe("drawer");
      const guessers = started!.participants.filter((p) => p.id !== hostId);
      expect(guessers).toHaveLength(3);
      guessers.forEach((g) => expect(g.role).toBe("guesser"));
    });

    it("selects a word deterministically based on room code", () => {
      const { room } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const started = startRoom(room.code, room.participants[0].id);

      expect(started!.secretWord).toBe(STARTER_WORDS[wordIndex(room.code)]);
    });

    it("selects word from STARTER_WORDS list", () => {
      const { room } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const started = startRoom(room.code, room.participants[0].id);

      expect(STARTER_WORDS).toContain(started!.secretWord);
    });
  });

  describe("toRoomSnapshot", () => {
    it("reveals secretWord to the drawer (host) via startRoom result", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const started = startRoom(room.code, hostId);

      expect(started).not.toBeNull();
      expect(started!.secretWord).toBeDefined();
    });

    it("assigns guesser role to non-host participants", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const guestId = joinRoom(room.code, "Bob")!.participantId;

      const started = startRoom(room.code, hostId);

      const guest = started!.participants.find((p) => p.id === guestId);
      expect(guest?.role).toBe("guesser");
    });
  });

  describe("host transfer", () => {
    it("transfers host to earliest joiner when host leaves", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room.code, "Bob")!.participantId;
      const charlieId = joinRoom(room.code, "Charlie")!.participantId;

      leaveRoom(room.code, hostId);

      const joined = joinRoom(room.code, "Diana");
      expect(joined).not.toBeNull();
      expect(joined!.room.hostId).toBe(bobId);
    });

    it("assigns new host as drawer when game starts after host transfer", () => {
      const { room, participantId: hostId } = createRoom("Alice");
      const bobId = joinRoom(room.code, "Bob")!.participantId;
      joinRoom(room.code, "Charlie");

      leaveRoom(room.code, hostId);

      const started = startRoom(room.code, bobId);

      expect(started).not.toBeNull();
      expect(started!.status).toBe("playing");
      const newHost = started!.participants.find((p) => p.id === bobId);
      expect(newHost?.role).toBe("drawer");
    });
  });
});
