import { randomUUID } from "node:crypto";
import type { CanvasStroke, Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

function deterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

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

function throwError(statusCode: number, message: string): never {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  throw error;
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    round: 0,
    guesses: [],
    drawing: [],
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

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.scores[participant.id] = 0;
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throwError(404, "Room not found");
  }

  if (room!.hostId !== participantId) {
    throwError(403, "Only the host can start the game");
  }

  if (room!.participants.length < 2) {
    throwError(400, "At least 2 players are required to start");
  }

  const hash = deterministicHash(room!.code);
  const drawerIndex = hash % room!.participants.length;
  const drawerId = room!.participants[drawerIndex].id;
  const wordIndex = Math.floor(hash / room!.participants.length) % STARTER_WORDS.length;
  const secretWord = STARTER_WORDS[wordIndex];

  room!.status = "playing";
  room!.drawerId = drawerId;
  room!.secretWord = secretWord;
  room!.round += 1;
  room!.guesses = [];
  room!.drawing = [];
  room!.scores = {};

  for (const p of room!.participants) {
    room!.scores[p.id] = 0;
  }

  rooms.set(room!.code, cloneRoom(room!));
  return { room: cloneRoom(room!) };
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    throwError(404, "Room not found");
  }

  if (room!.status !== "playing") {
    throwError(400, "Game is not in progress");
  }

  if (participantId === room!.drawerId) {
    throwError(400, "Drawer cannot guess");
  }

  const trimmed = text.trim();

  if (!trimmed) {
    throwError(400, "Guess cannot be empty");
  }

  const isCorrect = trimmed.toLowerCase() === room!.secretWord!.toLowerCase();

  const guess: Guess = {
    participantId,
    text: trimmed,
    correct: isCorrect,
    timestamp: now()
  };

  room!.guesses.push(guess);

  if (isCorrect) {
    room!.scores[participantId] = (room!.scores[participantId] || 0) + 100;
  }

  const guesserIds = room!.participants
    .filter((p) => p.id !== room!.drawerId)
    .map((p) => p.id);

  const allCorrect = guesserIds.every((id) =>
    room!.guesses.some((g) => g.participantId === id && g.correct)
  );

  if (allCorrect) {
    room!.status = "finished";
  }

  rooms.set(room!.code, cloneRoom(room!));
  return { room: cloneRoom(room!) };
}

export function addStroke(code: string, participantId: string, stroke: CanvasStroke) {
  const room = rooms.get(code);

  if (!room) {
    throwError(404, "Room not found");
  }

  if (room!.drawerId !== participantId) {
    throwError(403, "Only the drawer can draw");
  }

  if (room!.status !== "playing") {
    throwError(400, "Game is not in progress");
  }

  room!.drawing.push(stroke);
  rooms.set(room!.code, cloneRoom(room!));
  return { room: cloneRoom(room!) };
}

export function clearDrawing(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throwError(404, "Room not found");
  }

  if (room!.drawerId !== participantId) {
    throwError(403, "Only the drawer can clear the canvas");
  }

  room!.drawing = [];
  rooms.set(room!.code, cloneRoom(room!));
  return { room: cloneRoom(room!) };
}

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throwError(404, "Room not found");
  }

  if (room!.drawerId !== participantId && room!.hostId !== participantId) {
    throwError(403, "Only the drawer or host can end the round");
  }

  if (room!.status !== "playing") {
    throwError(400, "Game is not in progress");
  }

  room!.status = "finished";
  rooms.set(room!.code, cloneRoom(room!));
  return { room: cloneRoom(room!) };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throwError(404, "Room not found");
  }

  if (room!.hostId !== participantId) {
    throwError(403, "Only the host can restart the game");
  }

  room!.status = "lobby";
  room!.drawerId = null;
  room!.secretWord = null;
  room!.round = 0;
  room!.guesses = [];
  room!.drawing = [];
  room!.scores = {};

  for (const p of room!.participants) {
    room!.scores[p.id] = 0;
  }

  rooms.set(room!.code, cloneRoom(room!));
  return { room: cloneRoom(room!) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer || room.status === "finished" ? room.secretWord : null,
    round: room.round,
    guesses: room.guesses.map((g) => ({ ...g })),
    drawing: room.drawing.map((s) => structuredClone(s)),
    scores: { ...room.scores },
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
