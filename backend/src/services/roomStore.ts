import { randomUUID } from "node:crypto";
import { HttpError } from "../api/schemas.js";
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

function requireName(name?: string): string {
  const trimmed = (name ?? "").trim();

  if (!trimmed) {
    throw new HttpError(400, "Enter a player name.");
  }

  return trimmed;
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

// Deterministic word pick: stable per room code (sum of char codes mod word count).
export function selectWord(code: string): string {
  const sum = [...code].reduce((total, char) => total + char.charCodeAt(0), 0);
  return STARTER_WORDS[sum % STARTER_WORDS.length];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(requireName(playerName));
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

  const participant = createParticipant(requireName(playerName));
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
    throw new HttpError(404, "Unable to load room");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can start the game.");
  }

  if (room.participants.length < 2) {
    throw new HttpError(409, "Need at least 2 players to start.");
  }

  room.status = "active";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = Boolean(room.drawerId) && room.drawerId === viewerParticipantId;
  const role = room.drawerId ? (isDrawer ? "drawer" : "guesser") : undefined;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    role,
    // Word is exposed ONLY to the drawer; `undefined` is omitted from the JSON payload,
    // so a guesser never receives the word (or its length).
    word: isDrawer ? room.secretWord : undefined,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
