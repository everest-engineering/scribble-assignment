import { randomUUID } from "node:crypto";
import { GuessPayload } from "../models/guess.js";
import { getRoom, saveRoom } from "./roomStore.js";

export function handleGuess(roomCode: string, participantId: string, payload: GuessPayload) {
  const room = getRoom(roomCode);
  if (!room) {
    throw new Error("Room not found");
  }
  
  if (room.status !== "playing") {
    throw new Error("Cannot guess when not playing");
  }

  if (room.drawerId === participantId) {
    throw new Error("Drawer cannot guess");
  }

  const participant = room.participants.find(p => p.id === participantId);
  if (!participant) {
    throw new Error("Participant not found");
  }

  const guessText = payload.text.trim();
  const isCorrect = guessText.toLowerCase() === room.secretWord?.toLowerCase();

  const guess = {
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text: guessText,
    isCorrect,
    timestamp: Date.now(),
  };

  room.guesses.push(guess);

  if (isCorrect) {
    participant.score += 100;
    room.status = "result";
  }

  return saveRoom(room);
}
