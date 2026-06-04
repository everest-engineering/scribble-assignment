import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startGame, updateCanvas, submitGuess, getRoom } from "./roomStore.js";

describe("Scenario 3: Gameplay Interaction", () => {
  it("drawer can update canvas", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    joinRoom(initialRoom.code, "Guest");
    startGame(initialRoom.code, hostId);
    
    updateCanvas(initialRoom.code, hostId, "some-drawing-data");
    const updatedRoom = getRoom(initialRoom.code);
    expect(updatedRoom?.canvasData).toBe("some-drawing-data");
  });

  it("non-drawer cannot update canvas", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    startGame(initialRoom.code, hostId);
    
    expect(() => updateCanvas(initialRoom.code, guestId, "illegal-data")).toThrow("Only the drawer can update the canvas");
  });

  it("guesser can submit correct guess and gain points", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    const startedRoom = startGame(initialRoom.code, hostId)!;
    const secretWord = startedRoom.secretWord!;
    
    submitGuess(initialRoom.code, guestId, secretWord);
    
    const updatedRoom = getRoom(initialRoom.code);
    expect(updatedRoom?.guesses).toHaveLength(1);
    expect(updatedRoom?.guesses[0].isCorrect).toBe(true);
    expect(updatedRoom?.scores[guestId]).toBe(100);
  });

  it("guesser can submit incorrect guess and gain no points", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    const { participantId: guestId } = joinRoom(initialRoom.code, "Guest")!;
    startGame(initialRoom.code, hostId);
    
    submitGuess(initialRoom.code, guestId, "wrong-guess");
    
    const updatedRoom = getRoom(initialRoom.code);
    expect(updatedRoom?.guesses).toHaveLength(1);
    expect(updatedRoom?.guesses[0].isCorrect).toBe(false);
    expect(updatedRoom?.scores[guestId]).toBe(0);
  });

  it("drawer cannot submit guesses", () => {
    const { room: initialRoom, participantId: hostId } = createRoom("Host");
    joinRoom(initialRoom.code, "Guest");
    startGame(initialRoom.code, hostId);
    
    expect(() => submitGuess(initialRoom.code, hostId, "any-guess")).toThrow("Drawers cannot submit guesses");
  });
});
