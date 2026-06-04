import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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
  return (name ?? "").trim() || "Player";
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

function selectWord(roomCode: string): string {
  const index = roomCode.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
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

export function startGame(code: string, participantId: string): { ok: true; room: Room } | { ok: false; error: string } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "Only the host can start the game" };
  }

  if (room.status !== "lobby") {
    return { ok: false, error: "Game has already started" };
  }

  if (room.participants.length < 2) {
    return { ok: false, error: "Need at least 2 players to start" };
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.canvasData = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, text: string): { ok: true; room: Room } | { ok: false; error: string } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (room.status !== "playing") {
    return { ok: false, error: "Game is not in progress" };
  }

  if (participantId === room.drawerId) {
    return { ok: false, error: "Drawer cannot submit guesses" };
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { ok: false, error: "Participant not found" };
  }

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text,
    correct: text.toLowerCase() === room.secretWord?.toLowerCase()
  };

  room.guesses.push(guess);

  if (guess.correct && room.scores[participantId] !== undefined) {
    room.scores[participantId] += 100;
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function updateCanvas(code: string, participantId: string, canvasData: string): { ok: true; room: Room } | { ok: false; error: string } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (participantId !== room.drawerId) {
    return { ok: false, error: "Only the drawer can update the canvas" };
  }

  room.canvasData = canvasData;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function clearCanvas(code: string, participantId: string): { ok: true; room: Room } | { ok: false; error: string } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (participantId !== room.drawerId) {
    return { ok: false, error: "Only the drawer can clear the canvas" };
  }

  room.canvasData = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string): { ok: true; room: Room } | { ok: false; error: string } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "Only the host can restart the game" };
  }

  if (room.status !== "result") {
    return { ok: false, error: "Game is not in result state" };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.scores = {};
  room.canvasData = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: room.drawerId,
    secretWord: isDrawer && room.secretWord ? room.secretWord : "",
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    canvasData: room.canvasData,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
