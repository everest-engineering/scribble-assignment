import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

type Result<T> = { error: string } | { ok: T };

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
  if (!name) return "Player";
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now()
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
    hostId: participant.id,
    participants: [participant],
    drawerId: null,
    secretWord: null,
    round: 0,
    guesses: [],
    scores: {},
    canvasData: null,
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

export function startGame(code: string, participantId: string): Result<Room> {
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
    return { error: "Game is already in progress" };
  }

  room.status = "playing";
  room.drawerId = room.participants[0].id;
  room.round = 1;
  room.secretWord = STARTER_WORDS[(room.round - 1) % STARTER_WORDS.length];
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.canvasData = null;
  room.updatedAt = now();

  rooms.set(room.code, cloneRoom(room));

  return { ok: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, word: string): Result<Room> {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.status !== "playing") {
    return { error: "Round is not active" };
  }

  if (room.drawerId === participantId) {
    return { error: "Drawer cannot submit guesses" };
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found" };
  }

  const isCorrect = word.toLowerCase() === room.secretWord?.toLowerCase();

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    word,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);

  if (isCorrect && room.scores[participantId] === 0) {
    room.scores[participantId] = 100;
    room.status = "round_end";
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return { ok: cloneRoom(room) };
}

export function updateCanvas(code: string, participantId: string, dataUrl: string): Result<Room> {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.drawerId !== participantId) {
    return { error: "Only the drawer can update the canvas" };
  }

  room.canvasData = dataUrl;
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return { ok: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string): Result<Room> {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" };
  }

  if (room.hostId !== participantId) {
    return { error: "Only the host can restart the game" };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.round = 0;
  room.guesses = [];
  room.scores = {};
  room.canvasData = null;
  room.updatedAt = now();

  rooms.set(room.code, cloneRoom(room));

  return { ok: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((p) => ({ ...p })),
    drawerId: room.drawerId,
    secretWord: isDrawer || room.status === "round_end" ? room.secretWord : null,
    round: room.round,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    canvasData: room.canvasData,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
