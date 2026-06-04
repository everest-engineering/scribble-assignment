import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, toRoomSnapshot } from "./roomStore.js";

describe("Scenario 2: Game Start & Drawer Flow", () => {
  it("fails to start game if not the host", () => {
    const { room: initialRoom } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    
    expect(() => startGame(initialRoom.code, guestId)).toThrow("Only the host can start the game");
  });

  it("fails to start game with only 1 player", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    expect(() => startGame(initialRoom.code, hostId)).toThrow("At least 2 players are required to start");
  });

  it("successfully starts game with 2 players", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    joinRoom(initialRoom.code, "Guest");
    
    const startedRoom = startGame(initialRoom.code, hostId);
    expect(startedRoom?.status).toBe("playing");
    expect(startedRoom?.drawerId).toBe(hostId);
    expect(startedRoom?.secretWord).toBeDefined();
  });

  it("hides secret word from non-drawers in snapshot", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    const startedRoom = startGame(initialRoom.code, hostId)!;
    
    const hostSnapshot = toRoomSnapshot(startedRoom, hostId);
    const guestSnapshot = toRoomSnapshot(startedRoom, guestId);
    
    expect(hostSnapshot.secretWord).toBe(startedRoom.secretWord);
    expect(hostSnapshot.isDrawer).toBe(true);
    
    expect(guestSnapshot.secretWord).toBeUndefined();
    expect(guestSnapshot.isDrawer).toBe(false);
  });
});
