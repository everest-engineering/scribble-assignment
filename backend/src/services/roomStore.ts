import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { HttpError } from "../api/schemas.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

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

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    isHost
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
  participant.isHost = true;
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    drawerId: "",
    secretWord: "",
    round: 0,
    guesses: [],
    scores: {},
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant || !participant.isHost) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are required to start");
  }

  room.status = "playing";
  room.drawerId = room.participants[0].id;
  room.secretWord = STARTER_WORDS[0];
  room.round = 1;
  room.guesses = [];
  room.scores = {};
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Game is not in progress");
  }

  const trimmed = text.trim();

  if (!trimmed) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  if (participantId === room.drawerId) {
    throw new HttpError(400, "Drawer cannot submit guesses");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new HttpError(404, "Participant not found in this room");
  }

  const isCorrect = trimmed.toLowerCase() === room.secretWord.toLowerCase();

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: trimmed,
    isCorrect,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (isCorrect && room.scores[participantId] === undefined) {
    room.scores[participantId] = 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(room, participantId);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = !!(room.drawerId && viewerParticipantId === room.drawerId);

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: room.drawerId ?? "",
    secretWord: isDrawer ? room.secretWord : undefined,
    round: room.round ?? 0,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
