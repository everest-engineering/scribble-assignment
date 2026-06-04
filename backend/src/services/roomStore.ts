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

function validateName(name?: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    throw new Error("Name cannot be empty");
  }
  return trimmed;
}

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: name,
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

export function createRoom(playerName?: string) {
  const validatedName = validateName(playerName);
  const participant = createParticipant(validatedName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
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

  const validatedName = validateName(playerName);
  const participant = createParticipant(validatedName);
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw Object.assign(new Error("Room not found"), { statusCode: 404 });
  }

  if (room.status !== "lobby") {
    throw Object.assign(new Error("Game has already started"), { statusCode: 400 });
  }

  if (room.hostId !== participantId) {
    throw Object.assign(new Error("Only the host can start the game"), { statusCode: 403 });
  }

  if (room.participants.length < 2) {
    throw Object.assign(new Error("Need at least 2 players to start"), { statusCode: 400 });
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[0];
  room.round = 1;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { started: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const scores: Record<string, number> = {};
  for (const p of room.participants) {
    scores[p.id] = p.score ?? 0;
  }

  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer ? room.secretWord : undefined,
    round: room.round ?? 1,
    participants: room.participants.map((p) => ({ ...p })),
    scores,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
