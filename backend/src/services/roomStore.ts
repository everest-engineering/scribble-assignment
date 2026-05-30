import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

const RATE_LIMIT_CREATE_MAX = 5;
const RATE_LIMIT_JOIN_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface RateLimitEntry {
  createAttempts: { timestamp: number }[];
  joinAttempts: { timestamp: number }[];
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function pruneRateLimitEntry(entry: RateLimitEntry, now: number) {
  entry.createAttempts = entry.createAttempts.filter((a) => now - a.timestamp < RATE_LIMIT_WINDOW_MS);
  entry.joinAttempts = entry.joinAttempts.filter((a) => now - a.timestamp < RATE_LIMIT_WINDOW_MS);
}

export function checkCreateRateLimit(key: string): boolean {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  pruneRateLimitEntry(entry, now);
  return entry.createAttempts.length < RATE_LIMIT_CREATE_MAX;
}

export function recordCreateAttempt(key: string) {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  entry.createAttempts.push({ timestamp: now });
}

export function checkJoinRateLimit(key: string): boolean {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  pruneRateLimitEntry(entry, now);
  return entry.joinAttempts.length < RATE_LIMIT_JOIN_MAX;
}

export function recordJoinAttempt(key: string) {
  const now = Date.now();
  let entry = rateLimitMap.get(key);
  if (!entry) {
    entry = { createAttempts: [], joinAttempts: [] };
    rateLimitMap.set(key, entry);
  }
  entry.joinAttempts.push({ timestamp: now });
}

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

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
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

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
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

  let resolvedName = displayName(playerName);
  const existingNames = room.participants.map((p) => p.name);
  if (existingNames.includes(resolvedName)) {
    let suffix = 2;
    while (existingNames.includes(`${resolvedName} (${suffix})`)) {
      suffix++;
    }
    resolvedName = `${resolvedName} (${suffix})`;
  }

  const participant = createParticipant(resolvedName);
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

export function getRoomStatus(code: string) {
  const room = rooms.get(code);
  return room ? room.status : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" } as const;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return { error: "Participant not found in room" } as const;
  }

  if (!participant.isHost) {
    return { error: "Only the host can start the game" } as const;
  }

  if (room.participants.length < 2) {
    return { error: "At least 2 players are required to start the game" } as const;
  }

  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  void viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
