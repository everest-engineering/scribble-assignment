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

export function startRoom(code: string, participantId: string): StartRoomResult {
  const normalizedCode = normalizeRoomCode(code);

  if (!isValidRoomCode(normalizedCode)) {
    return { ok: false, statusCode: 400, message: "Invalid room code" };
  }

  const room = rooms.get(normalizedCode);

  if (!room) {
    return { ok: false, statusCode: 404, message: "Unable to load room" };
  }

  const participant = room.participants.find((candidate) => candidate.id === participantId);

  if (!participant) {
    return { ok: false, statusCode: 404, message: "Participant not found in room" };
  }

  if (room.hostParticipantId !== participant.id) {
    return { ok: false, statusCode: 403, message: "Only the host can start the game" };
  }

  if (room.participants.length < 2) {
    return { ok: false, statusCode: 400, message: "At least 2 players are required to start" };
  }

  room.status = "inGame";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = Boolean(viewerParticipantId && viewerParticipantId === room.hostParticipantId);

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostParticipantId: room.hostParticipantId,
    viewerParticipantId,
    isHost,
    canStart: room.status === "lobby" && isHost && room.participants.length >= 2,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
