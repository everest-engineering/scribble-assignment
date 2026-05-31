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

export function listWords() {
  return [...STARTER_WORDS];
}

export function selectWord(code: string, words: readonly string[]): string {
  const index = [...code].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % words.length;
  return words[index];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    hostId: participant.id,
    status: "lobby",
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    drawerId: "",
    secretWord: "",
    guesses: [],
    scores: {}
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

  if (room.status !== "lobby") {
    throw new HttpError(409, "Game already in progress");
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

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "lobby") {
    throw new HttpError(409, "Game already in progress");
  }

  if (participantId !== room.hostId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are required to start");
  }

  room.status = "active";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code, STARTER_WORDS);
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string): Room {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "active") {
    throw new HttpError(409, "Game is not active");
  }

  if (!room.participants.some((p) => p.id === participantId)) {
    throw new HttpError(403, "Participant not in room");
  }

  if (participantId === room.drawerId) {
    throw new HttpError(403, "Drawer cannot guess");
  }

  const trimmed = text.trim();

  if (!trimmed) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  const correct = trimmed.toLowerCase() === room.secretWord.toLowerCase();
  const guess: Guess = {
    participantId,
    participantName: room.participants.find((p) => p.id === participantId)!.name,
    text: trimmed,
    correct,
    index: room.guesses.length
  };

  room.guesses.push(guess);

  if (correct) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.status = "ended";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isActive = room.status === "active";
  const isEnded = room.status === "ended";
  const isDrawer = isActive && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    hostId: room.hostId,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: isActive && !isDrawer ? [] : listWords(),
    roles: [...STARTER_ROLES],
    drawerId: room.drawerId,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    ...(isActive && isDrawer ? { secretWord: room.secretWord } : {}),
    ...(isActive && !isDrawer
      ? { wordPlaceholder: [...room.secretWord].map(() => "_").join(" ") }
      : {}),
    ...(isEnded ? { secretWord: room.secretWord } : {})
  };
}
