import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
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

export function normalizePlayerName(name?: string) {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) {
    throw new Error("Player name is required");
  }
  return trimmed;
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
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

export function selectWord(code: string) {
  const sum = code.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STARTER_WORDS[sum % STARTER_WORDS.length];
}

export function createRoom(playerName?: string) {
  const name = normalizePlayerName(playerName);
  const participant = createParticipant(name);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    strokes: [],
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

  const name = normalizePlayerName(playerName);
  const participant = createParticipant(name);
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

function getParticipant(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId);
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new Error("Unable to load room");
  }
  if (room.hostId !== participantId) {
    throw new Error("Only the host can start the game");
  }
  if (room.status !== "lobby") {
    throw new Error("Game already started");
  }
  if (room.participants.length < 2) {
    throw new Error("At least 2 players are required to start");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  room.strokes = [];
  room.guesses = [];
  room.participants = room.participants.map((participant) => ({
    ...participant,
    score: 0
  }));
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function addStroke(code: string, participantId: string, stroke: Stroke) {
  const room = rooms.get(code);
  if (!room) {
    throw new Error("Unable to load room");
  }
  if (room.status !== "playing") {
    throw new Error("Game is not in progress");
  }
  if (room.drawerId !== participantId) {
    throw new Error("Only the drawer can draw");
  }

  room.strokes.push(stroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearCanvas(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new Error("Unable to load room");
  }
  if (room.status !== "playing") {
    throw new Error("Game is not in progress");
  }
  if (room.drawerId !== participantId) {
    throw new Error("Only the drawer can clear the canvas");
  }

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new Error("Unable to load room");
  }
  if (room.status !== "playing") {
    throw new Error("Game is not in progress");
  }
  if (room.drawerId === participantId) {
    throw new Error("Drawer cannot guess");
  }

  const trimmed = guessText.trim();
  if (!trimmed) {
    throw new Error("Guess is required");
  }

  const participant = getParticipant(room, participantId);
  if (!participant) {
    throw new Error("Participant not found");
  }

  const correct =
    room.secretWord !== undefined &&
    trimmed.toLowerCase() === room.secretWord.toLowerCase();

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text: trimmed,
    correct,
    createdAt: now()
  };

  room.guesses.push(guess);

  if (correct) {
    participant.score += 100;
    room.status = "result";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) {
    throw new Error("Unable to load room");
  }
  if (room.hostId !== participantId) {
    throw new Error("Only the host can restart the game");
  }
  if (room.status !== "result") {
    throw new Error("Game is not in result state");
  }

  room.status = "lobby";
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.strokes = [];
  room.guesses = [];
  room.participants = room.participants.map((participant) => ({
    ...participant,
    score: 0
  }));
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = viewerParticipantId === room.hostId;
  const isDrawer = viewerParticipantId === room.drawerId;
  const showSecretWord =
    room.secretWord !== undefined &&
    (room.status === "result" || (room.status === "playing" && isDrawer));

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    isHost,
    drawerId: room.drawerId,
    secretWord: showSecretWord ? room.secretWord : undefined,
    participants: room.participants.map((participant) => ({ ...participant })),
    strokes: room.strokes.map((stroke) => ({
      points: stroke.points.map((point) => ({ ...point }))
    })),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
