import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, submitGuess, endRound, restartGame, getRoom } from "./roomStore.js";

describe("Scenario 4: Result, Restart & Final Validation", () => {
  it("host can end the round", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    joinRoom(initialRoom.code, "Guest");
    startGame(initialRoom.code, hostId);
    
    endRound(initialRoom.code, hostId);
    const updatedRoom = getRoom(initialRoom.code);
    expect(updatedRoom?.status).toBe("result");
  });

  it("non-host cannot end the round", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    startGame(initialRoom.code, hostId);
    
    expect(() => endRound(initialRoom.code, guestId)).toThrow("Only the host can end the round");
  });

  it("restart resets the room state but preserves participants", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    const startedRoom = startGame(initialRoom.code, hostId)!;
    submitGuess(initialRoom.code, guestId, startedRoom.secretWord!);
    endRound(initialRoom.code, hostId);
    
    const restartedRoom = restartGame(initialRoom.code, hostId);
    expect(restartedRoom?.status).toBe("lobby");
    expect(restartedRoom?.participants).toHaveLength(2);
    expect(restartedRoom?.drawerId).toBeUndefined();
    expect(restartedRoom?.secretWord).toBeUndefined();
    expect(restartedRoom?.canvasData).toBe("");
    expect(restartedRoom?.guesses).toHaveLength(0);
    expect(restartedRoom?.scores[guestId]).toBe(0);
  });
});
