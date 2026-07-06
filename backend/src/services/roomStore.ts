import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

const words = [...STARTER_WORDS];

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

function createParticipant(name: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now(),
    isHost
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    currentRound: 0,
    currentDrawerId: "",
    secretWord: null,
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

export function selectWord(round: number): string {
  return words[(round - 1) % words.length];
}

export function startGame(code: string, requesterId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, error: new HttpError(404, "Room not found") };
  }

  if (room.status !== "lobby") {
    return { ok: false as const, error: new HttpError(400, "Game has already started") };
  }

  if (room.hostId !== requesterId) {
    return { ok: false as const, error: new HttpError(403, "Only the host can start the game") };
  }

  if (room.participants.length < 2) {
    return { ok: false as const, error: new HttpError(400, "Need at least 2 players to start") };
  }

  const secretWord = selectWord(1);
  room.status = "drawing";
  room.currentRound = 1;
  room.currentDrawerId = room.hostId;
  room.secretWord = secretWord;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    currentRound: room.currentRound,
    currentDrawerId: room.currentDrawerId,
    secretWord: viewerParticipantId === room.currentDrawerId ? room.secretWord : null
  };
}
