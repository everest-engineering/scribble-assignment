import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
const ROOM_CODE_PATTERN = /^[A-Z0-9]{4}$/;

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

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

function isValidRoomCode(code: string) {
  return ROOM_CODE_PATTERN.test(code);
}

function displayName(name: string) {
  return name.trim();
}

function createParticipant(name: string): Participant {
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

export function selectSecretWord(roomCode: string, words = listWords()) {
  if (words.length === 0) {
    return null;
  }

  const checksum = normalizeRoomCode(roomCode)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return words[checksum % words.length];
}

export function clearRooms() {
  rooms.clear();
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const createdAt = now();
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostParticipantId: participant.id,
    createdAt,
    updatedAt: createdAt
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return null;
  }

  const room = rooms.get(normalizedCode);

  if (!room || room.status !== "lobby") {
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
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return null;
  }

  const room = rooms.get(normalizedCode);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; statusCode: 400 | 403 | 404; message: string };

function selectDrawer(room: Room) {
  const host = room.participants.find((participant) => participant.id === room.hostParticipantId);

  if (host) {
    return host;
  }

  return [...room.participants].sort((left, right) => left.joinedAt.localeCompare(right.joinedAt))[0] ?? null;
}

export function startRoom(code: string, participantId: string): StartRoomResult {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return { ok: false, statusCode: 400, message: "Invalid room code" };
  }

  const room = rooms.get(normalizedCode);

  if (!room) {
    return { ok: false, statusCode: 404, message: "Unable to load room" };
  }

  if (room.status !== "lobby") {
    return { ok: false, statusCode: 400, message: "Room is already playing" };
  }

  const participant = room.participants.find((candidate) => candidate.id === participantId);

  if (!participant) {
    return { ok: false, statusCode: 404, message: "Participant not found in room" };
  }

  if (room.participants.length < 2) {
    return { ok: false, statusCode: 400, message: "At least 2 players are required to start" };
  }

  const drawer = selectDrawer(room);

  if (!drawer) {
    return { ok: false, statusCode: 400, message: "Unable to assign drawer" };
  }

  if (drawer.id !== participant.id) {
    return { ok: false, statusCode: 403, message: "Only the host can start the game" };
  }

  const secretWord = selectSecretWord(room.code);

  if (!secretWord) {
    return { ok: false, statusCode: 400, message: "No words are available to start" };
  }

  const startedAt = now();
  room.status = "playing";
  room.currentRound = {
    roundNumber: 1,
    drawerParticipantId: drawer.id,
    secretWord,
    startedAt
  };
  room.updatedAt = startedAt;
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = Boolean(viewerParticipantId && viewerParticipantId === room.hostParticipantId);
  const drawer = room.currentRound
    ? room.participants.find((participant) => participant.id === room.currentRound?.drawerParticipantId)
    : null;
  const isDrawer = Boolean(viewerParticipantId && drawer && viewerParticipantId === drawer.id);
  const currentRound =
    room.currentRound && drawer
      ? {
          roundNumber: room.currentRound.roundNumber,
          drawerParticipantId: drawer.id,
          drawerName: drawer.name
        }
      : undefined;
  const viewerRole = room.currentRound ? (isDrawer ? "drawer" : "guesser") : undefined;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostParticipantId: room.hostParticipantId,
    viewerParticipantId,
    isHost,
    canStart: room.status === "lobby" && isHost && room.participants.length >= 2,
    currentRound,
    viewerRole,
    isDrawer,
    availableWords: room.status === "lobby" ? listWords() : [],
    roles: [...STARTER_ROLES]
  };

  if (room.currentRound && isDrawer) {
    snapshot.secretWord = room.currentRound.secretWord;
  }

  return snapshot;
}
