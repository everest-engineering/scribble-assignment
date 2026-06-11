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
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    guesses: [],
    scores: {},
    roundWon: false,
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

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function chooseWord(code: string) {
  const index = hashString(code) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

function maskWord(word: string) {
  return word.replace(/./g, "_");
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    return undefined;
  }

  if (room.participants.length < 2) {
    return undefined;
  }

  room.drawerId = room.hostId;
  room.secretWord = chooseWord(room.code);
  room.status = "active";
  room.roundWon = false;
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    return undefined;
  }

  room.drawerId = undefined;
  room.secretWord = undefined;
  room.status = "lobby";
  room.roundWon = false;
  room.guesses = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId != null && room.drawerId === viewerParticipantId;
  const word = room.status === "active" && room.secretWord ? (isDrawer ? room.secretWord : maskWord(room.secretWord)) : "Waiting for game start";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.drawerId,
    word,
    guesses: room.guesses,
    scores: room.scores,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
