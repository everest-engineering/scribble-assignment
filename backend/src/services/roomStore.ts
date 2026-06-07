import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
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
    hostId: participant.id,
    status: "lobby",
    participants: [participant],
    currentDrawerId: null,
    currentWord: null,
    guesses: [],
    scores: {},
    canvasData: "",
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function startGame(code: string, initiatorId: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }

  if (room.hostId !== initiatorId) {
    throw new Error("Only the host can start the game");
  }

  if (room.status !== "lobby") {
    throw new Error("Game has already started");
  }

  if (room.participants.length < 2) {
    throw new Error("At least 2 players are required to start");
  }

  const sortedWords = [...STARTER_WORDS].sort();
  const wordIndex = Math.min(room.participants.length - 1, sortedWords.length - 1);

  room.status = "playing";
  room.currentDrawerId = room.participants[0].id;
  room.currentWord = sortedWords[wordIndex];
  room.guesses = [];
  room.scores = {};
  room.canvasData = "";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: initiatorId
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

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }

  if (room.status !== "playing") {
    throw new Error("Game is not in progress");
  }

  if (participantId === room.currentDrawerId) {
    throw new Error("Drawer cannot submit guesses");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Guess cannot be empty");
  }

  const isCorrect = trimmed.toLowerCase() === room.currentWord?.toLowerCase();
  const guess = {
    participantId,
    text: trimmed,
    correct: isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);
  room.scores[participantId] = (room.scores[participantId] ?? 0) + (isCorrect ? 100 : 0);

  if (isCorrect) {
    room.status = "roundEnd";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function saveDraw(code: string, participantId: string, strokes: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }

  if (room.status !== "playing") {
    throw new Error("Game is not in progress");
  }

  if (participantId !== room.currentDrawerId) {
    throw new Error("Only the drawer can draw");
  }

  room.canvasData = strokes;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function restartGame(code: string, initiatorId: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }

  if (room.hostId !== initiatorId) {
    throw new Error("Only the host can restart the game");
  }

  room.status = "lobby";
  room.currentDrawerId = null;
  room.currentWord = null;
  room.guesses = [];
  room.scores = {};
  room.canvasData = "";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: initiatorId
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.currentDrawerId;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    participants: room.participants.map((p) => ({ ...p })),
    currentDrawerId: room.currentDrawerId ?? null,
    currentWord: isDrawer || room.status === "roundEnd" ? (room.currentWord ?? null) : null,
    guesses: [...room.guesses],
    scores: { ...room.scores },
    canvasData: room.canvasData,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
