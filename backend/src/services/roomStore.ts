import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

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
  return name || "Player";
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
  const trimmedName = (playerName || "").trim();
  if (trimmedName.length === 0) {
    throw new HttpError(400, "Player name cannot be empty");
  }

  const participant = createParticipant(trimmedName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    drawingData: "",
    guesses: [],
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

  if (room.status !== "lobby") {
    throw new HttpError(400, "Room is not in lobby status");
  }

  const trimmedName = (playerName || "").trim();
  if (trimmedName.length === 0) {
    throw new HttpError(400, "Player name cannot be empty");
  }

  const nameExists = room.participants.some(
    (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (nameExists) {
    throw new HttpError(400, "Player name is already taken");
  }

  const participant = createParticipant(trimmedName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are required to start the game");
  }

  room.status = "game";
  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[0]; // "rocket"
  room.drawingData = "";
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function updateDrawing(code: string, participantId: string, drawingData: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "game") {
    throw new HttpError(400, "Drawing is only allowed during active game");
  }

  if (room.drawerId !== participantId) {
    throw new HttpError(403, "Only the drawer can update the drawing");
  }

  room.drawingData = drawingData;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "game") {
    throw new HttpError(400, "Guesses are only allowed during active game");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(400, "Participant not in room");
  }

  if (room.drawerId === participantId) {
    throw new HttpError(400, "Drawer cannot submit guesses");
  }

  const trimmedGuessText = guessText.trim();
  if (trimmedGuessText.length === 0) {
    throw new HttpError(400, "Please enter a guess.");
  }

  const isCorrect = trimmedGuessText.toLowerCase() === room.secretWord?.toLowerCase();

  if (isCorrect) {
    participant.score += 100;
    room.status = "result";
  }

  const guess = {
    senderId: participantId,
    senderName: participant.name,
    text: trimmedGuessText,
    correct: isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId && room.drawerId && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer ? room.secretWord : null,
    drawingData: room.drawingData,
    guesses: room.guesses.map((g) => ({ ...g }))
  };
}
