import { randomUUID } from "node:crypto";
import type { DrawPoint, GuessEntry, Participant, Room, RoomSnapshot } from "../models/game.js";
import type { ParticipantRole } from "../models/game.js";
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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function pickWord(roomCode: string): string {
  const index = roomCode.charCodeAt(0) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

function getParticipantRole(room: Room, participantId: string): ParticipantRole {
  if (room.drawerId === participantId) return "drawer";
  return "guesser";
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
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
    drawStrokes: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
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

type StoreError = { error: string; status: number; };
type StoreSuccess = { room: Room; participantId: string; };

export function startGame(code: string, participantId: string): StoreError | StoreSuccess {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found", status: 404 };
  }

  if (room.hostId !== participantId) {
    return { error: "Only the host can start the game", status: 403 };
  }

  if (room.status !== "lobby") {
    return { error: "Game has already started", status: 400 };
  }

  if (room.participants.length < 2) {
    return { error: "Need at least 2 players to start", status: 400 };
  }

  const drawerId = room.participants[0].id;
  const secretWord = pickWord(room.code);

  room.status = "playing";
  room.drawerId = drawerId;
  room.secretWord = secretWord;
  room.guesses = [];
  room.scores = {};
  room.updatedAt = now();

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: drawerId
  };
}

export function submitGuess(code: string, participantId: string, text: string): StoreError | StoreSuccess {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found", status: 404 };
  }

  if (room.status !== "playing") {
    return { error: "Round is over", status: 400 };
  }

  if (room.drawerId === participantId) {
    return { error: "Drawer cannot submit guesses", status: 400 };
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    return { error: "Participant not found in room", status: 404 };
  }

  const isCorrect = text.toLowerCase() === room.secretWord!.toLowerCase();
  const guess: GuessEntry = {
    participantId,
    participantName: participant.name,
    text,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);

  if (isCorrect) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.status = "finished";
  } else {
    room.scores[participantId] = room.scores[participantId] ?? 0;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function restartGame(code: string, participantId: string): StoreError | StoreSuccess {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found", status: 404 };
  }

  if (room.hostId !== participantId) {
    return { error: "Only the host can restart the game", status: 403 };
  }

  if (room.status === "lobby") {
    return { error: "Game has not started yet", status: 400 };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.scores = {};
  room.drawStrokes = [];
  room.updatedAt = now();

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function submitDrawStroke(code: string, participantId: string, stroke: DrawPoint[]): StoreError | StoreSuccess {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found", status: 404 };
  }

  if (room.status !== "playing") {
    return { error: "Round is not active", status: 400 };
  }

  if (room.drawerId !== participantId) {
    return { error: "Only the drawer can draw", status: 403 };
  }

  room.drawStrokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function clearDrawing(code: string, participantId: string): StoreError | StoreSuccess {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found", status: 404 };
  }

  if (room.status !== "playing") {
    return { error: "Round is not active", status: 400 };
  }

  if (room.drawerId !== participantId) {
    return { error: "Only the drawer can clear the canvas", status: 403 };
  }

  room.drawStrokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerRole = viewerParticipantId ? getParticipantRole(room, viewerParticipantId) : "guesser";
  const isDrawer = viewerRole === "drawer";

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: room.drawerId,
    secretWord: isDrawer ? room.secretWord : null,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    drawStrokes: room.drawStrokes.map((s) => s.map((p) => ({ ...p }))),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    viewerRole
  };
}
