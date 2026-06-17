import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

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

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name?.trim() || "Player";
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
    hostId: participant.id,
    status: "lobby",
    participants: [participant],
    drawerId: null,
    secretWord: null,
    guesses: [],
    drawingData: null,
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

function getWordForParticipants(count: number): string {
  const index = (count - 1) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.hostId !== participantId) {
    return { error: "Only the host can start the game" };
  }

  if (room.participants.length < 2) {
    return { error: "At least 2 players are required to start" };
  }

  if (room.status !== "lobby") {
    return { error: "Game has already started" };
  }

  const drawerId = room.participants[0].id;
  const secretWord = getWordForParticipants(room.participants.length);

  room.status = "playing";
  room.drawerId = drawerId;
  room.secretWord = secretWord;
  room.guesses = [];
  room.drawingData = null;
  room.participants.forEach((p) => { p.score = 0; });
  room.updatedAt = now();

  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: "Round is not active" };
  }

  if (room.drawerId === participantId) {
    return { error: "The drawer cannot submit guesses" };
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found in room" };
  }

  const trimmedText = text.trim();
  if (trimmedText.length === 0) {
    return { error: "Guess cannot be empty" };
  }

  const isCorrect = trimmedText.toLowerCase() === room.secretWord?.toLowerCase();

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: trimmedText,
    isCorrect
  };

  room.guesses.push(guess);
  room.updatedAt = now();

  if (isCorrect) {
    participant.score += 100;
    room.status = "result";
  }

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    guess
  };
}

export function saveDrawing(code: string, participantId: string, drawingData: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.drawerId !== participantId) {
    return { error: "Only the drawer can submit drawings" };
  }

  if (room.status !== "playing") {
    return { error: "Round is not active" };
  }

  room.drawingData = drawingData;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function clearDrawing(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.drawerId !== participantId) {
    return { error: "Only the drawer can clear the canvas" };
  }

  if (room.status !== "playing") {
    return { error: "Round is not active" };
  }

  room.drawingData = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.drawerId !== participantId && room.hostId !== participantId) {
    return { error: "Only the drawer or host can end the round" };
  }

  if (room.status !== "playing") {
    return { error: "Round is not active" };
  }

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.hostId !== participantId) {
    return { error: "Only the host can restart the game" };
  }

  if (room.status !== "result") {
    return { error: "Game is not in result state" };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.drawingData = null;
  room.participants.forEach((p) => { p.score = 0; });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && room.drawerId === viewerParticipantId;
  const isResult = room.status === "result";

  const secretWord = (isDrawer || isResult) ? room.secretWord : null;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    participants: room.participants.map((p) => ({ ...p })),
    drawerId: room.drawerId,
    secretWord,
    guesses: room.guesses.map((g) => ({ ...g })),
    drawingData: room.drawingData,
    availableWords: listWords()
  };
}
