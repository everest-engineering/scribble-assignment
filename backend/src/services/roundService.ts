import { randomUUID } from "node:crypto";
import type { Guess } from "../models/game.js";
import { HttpError } from "../api/schemas.js";
import { getRoom, toRoomSnapshot, saveRoom } from "./roomStore.js";

function now() {
  return new Date().toISOString();
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = getRoom(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Round is not active");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new HttpError(404, "Participant not found");
  }

  if (participant.role !== "guesser") {
    throw new HttpError(403, "Only guessers can submit guesses");
  }

  const trimmedText = text.trim().slice(0, 100);

  if (!trimmedText) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  const isCorrect = trimmedText.toLowerCase() === (room.word ?? "").toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    text: trimmedText,
    isCorrect,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (isCorrect) {
    room.status = "finished";
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.roundResult = {
      secretWord: room.word ?? "",
      guessHistory: [...room.guesses],
      scores: { ...room.scores },
      winnerId: participantId,
      endedAt: now()
    };
  }

  const updatedRoom = saveRoom(room);

  if (!updatedRoom) {
    throw new HttpError(500, "Failed to save room");
  }

  return toRoomSnapshot(updatedRoom, participantId);
}
