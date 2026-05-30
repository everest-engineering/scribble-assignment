import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRoom } from "./roomStore.js";

describe("roomStore", () => {
  describe("createRoom", () => {
    it("returns a room with a 4-character uppercase code", () => {
      const result = createRoom("Alice");

      expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
      expect(result.room.participants).toHaveLength(1);
      expect(result.room.participants[0].name).toBe("Alice");
      expect(result.participantId).toBeDefined();
    });

    it("sets hostId equal to the creator's participantId", () => {
      const result = createRoom("Alice");

      expect(result.room.hostId).toBe(result.participantId);
    });

    it("creates the room with status lobby", () => {
      const result = createRoom("Alice");

      expect(result.room.status).toBe("lobby");
    });
  });

  describe("joinRoom", () => {
    it("returns null for an unknown room code", () => {
      const result = joinRoom("ZZZZ", "Bob");

      expect(result).toBeNull();
    });
  });

  describe("startRoom", () => {
    it("returns not_found for an unknown code", () => {
      const result = startRoom("ZZZZ", "some-id");

      expect(result).toEqual({ error: "not_found" });
    });

    it("returns forbidden when caller is not the host", () => {
      const { room } = createRoom("Alice");
      const result = startRoom(room.code, "not-the-host-id");

      expect(result).toEqual({ error: "forbidden" });
    });

    it("returns not_enough_players when only 1 participant", () => {
      const { room, participantId } = createRoom("Alice");
      const result = startRoom(room.code, participantId);

      expect(result).toEqual({ error: "not_enough_players" });
    });

    it("sets status to active when host starts with 2+ players", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");

      const result = startRoom(room.code, participantId);

      expect("room" in result).toBe(true);
      if ("room" in result) {
        expect(result.room.status).toBe("active");
        expect(result.room.hostId).toBe(participantId);
      }
    });
  });
});
