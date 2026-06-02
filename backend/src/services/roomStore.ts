import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const MAX_PLAYERS = 4;

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
  return (name ?? "").trim() || "Player";
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

type CreateRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "invalid_name" };

export function createRoom(playerName?: string): CreateRoomResult {
  if ((playerName ?? "").trim().length === 0) {
    return { ok: false, reason: "invalid_name" };
  }

  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    drawerId: null,
    currentWord: null
  };

  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

type JoinRoomResult =
  | { ok: true; room: Room; participantId: string }
  | { ok: false; reason: "not_found" | "full" | "invalid_name" };

export function joinRoom(code: string, playerName?: string): JoinRoomResult | null {
  if ((playerName ?? "").trim().length === 0) {
    return { ok: false, reason: "invalid_name" };
  }

  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.participants.length >= MAX_PLAYERS) {
    return { ok: false, reason: "full" };
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room),
    participantId: participant.id
  };
}

type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "already_started" | "too_few_players" };

export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.hostId !== participantId) {
    return { ok: false, reason: "not_host" };
  }

  if (room.status === "in-progress") {
    return { ok: false, reason: "already_started" };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "too_few_players" };
  }

  room.status = "in-progress";
  room.drawerId = participantId;
  room.currentWord = STARTER_WORDS[0];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const currentWord =
    room.drawerId && viewerParticipantId === room.drawerId ? room.currentWord : null;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    drawerId: room.drawerId,
    currentWord
  };
}
