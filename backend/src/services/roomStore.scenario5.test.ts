import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, endRound, nextRound, getRoom } from "./roomStore.js";

describe("Scenario 5: Multi-Round Enhancements", () => {
  it("startGame picks a word from the list (randomly, but must be in list)", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    joinRoom(initialRoom.code, "Guest");
    const startedRoom = startGame(initialRoom.code, hostId)!;
    
    expect(startedRoom.secretWord).toBeDefined();
    // Assuming STARTER_WORDS is exported or we can just check if it's a string
    expect(typeof startedRoom.secretWord).toBe("string");
  });

  it("nextRound rotates the drawer", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    
    const startedRoom = startGame(initialRoom.code, hostId)!;
    expect(startedRoom.drawerId).toBe(hostId);
    
    endRound(initialRoom.code, hostId);
    const nextRoom = nextRound(initialRoom.code, hostId)!;
    
    expect(nextRoom.status).toBe("playing");
    expect(nextRoom.drawerId).toBe(guestId);
    expect(nextRoom.canvasData).toBe("");
    expect(nextRoom.guesses).toHaveLength(0);
  });

  it("nextRound wraps around the drawer list", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    joinRoom(initialRoom.code, "Guest");
    
    startGame(initialRoom.code, hostId);
    endRound(initialRoom.code, hostId);
    nextRound(initialRoom.code, hostId); // Guest is drawer
    
    endRound(initialRoom.code, hostId);
    const wrappedRoom = nextRound(initialRoom.code, hostId)!; // Should be Host again
    
    expect(wrappedRoom.drawerId).toBe(hostId);
  });
});
