import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

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

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: name || "Player",
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
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
    hostParticipantId: participant.id,
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
  const normalized = normalizeCode(code);
  const room = rooms.get(normalized);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
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
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, participantId: string) {
  const normalized = normalizeCode(code);
  const room = rooms.get(normalized);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game has already started");
  }

  if (room.hostParticipantId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are needed to start");
  }

  if (!room.participants.some((p) => p.id === participantId)) {
    throw new HttpError(404, "Participant not found in room");
  }

  room.status = "inGame";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = viewerParticipantId ? room.hostParticipantId === viewerParticipantId : false;
  const canStart = isHost && room.status === "lobby" && room.participants.length >= 2;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostParticipantId: room.hostParticipantId,
    viewerParticipantId: viewerParticipantId ?? null,
    isHost,
    canStart,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
