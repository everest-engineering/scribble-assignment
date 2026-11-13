import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Guess } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

import { roomRepository } from "../db/roomRepository.js";

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (roomRepository.exists(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name ? name.trim() : "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    createdAt: now(),
    updatedAt: now()
  };

  roomRepository.save(room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string): { success: boolean; participantId?: string; room?: Room; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());

  if (!room) {
    return { success: false, error: "Room not found" };
  }

  if (room.status === "game") {
    return { success: false, error: "Room is already in game" };
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  roomRepository.save(room);

  return {
    success: true,
    participantId: participant.id,
    room: cloneRoom(room)
  };
}

export function getRoom(code: string) {
  const room = roomRepository.find(code.trim().toUpperCase());
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  roomRepository.save(room);
  return getRoom(room.code);
}

export function startGame(code: string, participantId: string): { success: boolean; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());
  if (!room) {
    return { success: false, error: "Room not found" };
  }
  if (room.hostId !== participantId) {
    return { success: false, error: "Only the host can start the game" };
  }
  if (room.participants.length < 2) {
    return { success: false, error: "At least 2 players are required to start the game" };
  }

  // Assign roles
  room.participants.forEach((participant) => {
    if (participant.id === room.hostId) {
      participant.role = "drawer";
    } else {
      participant.role = "guesser";
    }
  });

  room.status = "game";
  room.round = {
    secretWord: STARTER_WORDS[0], // "rocket"
    startedAt: now(),
    drawingData: "",
    guesses: []
  };
  room.updatedAt = now();
  roomRepository.save(room);
  return { success: true };
}

export function leaveRoom(code: string, participantId: string): { success: boolean; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());
  if (!room) {
    return { success: false, error: "Room not found" };
  }

  if (room.hostId === participantId) {
    roomRepository.delete(room.code);
    return { success: true };
  }

  const index = room.participants.findIndex((p) => p.id === participantId);
  if (index !== -1) {
    room.participants.splice(index, 1);
    room.updatedAt = now();
    roomRepository.save(room);
    return { success: true };
  }

  return { success: false, error: "Participant not found" };
}

export function updateDrawing(code: string, drawingData: string): { success: boolean; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());
  if (!room) {
    return { success: false, error: "Room not found" };
  }
  if (room.status !== "game") {
    return { success: false, error: "Room is not in game" };
  }
  if (!room.round) {
    return { success: false, error: "Game round not started" };
  }
  room.round.drawingData = drawingData;
  room.updatedAt = now();
  roomRepository.save(room);
  return { success: true };
}

export function clearDrawing(code: string): { success: boolean; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());
  if (!room) {
    return { success: false, error: "Room not found" };
  }
  if (room.status !== "game") {
    return { success: false, error: "Room is not in game" };
  }
  if (!room.round) {
    return { success: false, error: "Game round not started" };
  }
  room.round.drawingData = "";
  room.updatedAt = now();
  roomRepository.save(room);
  return { success: true };
}

export function submitGuess(code: string, participantId: string, guessText: string): { success: boolean; guess?: Guess; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());
  if (!room) {
    return { success: false, error: "Room not found" };
  }
  if (room.status !== "game") {
    return { success: false, error: "Room is not in game" };
  }
  if (!room.round) {
    return { success: false, error: "Game round not started" };
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { success: false, error: "Participant not found" };
  }

  if (participant.role === "drawer") {
    return { success: false, error: "Drawer cannot submit guesses" };
  }

  const normalizedGuess = guessText.trim().toLowerCase();
  const normalizedSecret = room.round.secretWord.trim().toLowerCase();
  const isCorrect = normalizedGuess === normalizedSecret;

  const alreadyGuessedCorrectly = room.round.guesses.some(
    (g) => g.playerName === participant.name && g.isCorrect
  );

  let scoreAwarded = 0;
  if (isCorrect && !alreadyGuessedCorrectly) {
    participant.score = (participant.score ?? 0) + 100;
    scoreAwarded = 100;
  }

  const guess: Guess = {
    id: randomUUID(),
    playerName: participant.name,
    text: guessText.trim(),
    isCorrect,
    scoreAwarded,
    timestamp: now()
  };

  room.round.guesses.push(guess);

  // Check if all guessers have successfully guessed the word
  const guessers = room.participants.filter((p) => p.role === "guesser");
  const uniqueCorrectGuessers = new Set(
    room.round.guesses.filter((g) => g.isCorrect).map((g) => g.playerName)
  );
  if (guessers.length > 0 && uniqueCorrectGuessers.size >= guessers.length) {
    room.status = "result";
  }

  room.updatedAt = now();
  roomRepository.save(room);

  return { success: true, guess };
}

export function endRound(code: string, participantId: string): { success: boolean; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());
  if (!room) {
    return { success: false, error: "Room not found" };
  }
  if (room.hostId !== participantId) {
    return { success: false, error: "Only the host can end the round" };
  }
  if (room.status !== "game") {
    return { success: false, error: "Game is not in progress" };
  }
  room.status = "result";
  room.updatedAt = now();
  roomRepository.save(room);
  return { success: true };
}

export function restartGame(code: string, participantId: string): { success: boolean; error?: string } {
  const room = roomRepository.find(code.trim().toUpperCase());
  if (!room) {
    return { success: false, error: "Room not found" };
  }
  if (room.hostId !== participantId) {
    return { success: false, error: "Only the host can restart the game" };
  }
  room.status = "lobby";
  room.round = undefined;
  room.participants.forEach((p) => {
    p.role = undefined;
    p.score = 0;
  });
  room.updatedAt = now();
  roomRepository.save(room);
  return { success: true };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId
    ? room.participants.some((p) => p.id === viewerParticipantId && p.role === "drawer")
    : false;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({
      ...participant,
      isHost: participant.id === room.hostId,
      role: participant.role
    })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if ((room.status === "game" || room.status === "result") && room.round) {
    snapshot.drawingData = room.round.drawingData;
    snapshot.guesses = room.round.guesses;
    if (isDrawer || room.status === "result") {
      snapshot.secretWord = room.round.secretWord;
    }
  }

  return snapshot;
}
