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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now(),
    role: "guesser",
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
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
    hostId: participant.id,
    createdAt: now(),
    updatedAt: now(),
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id,
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
    participantId: participant.id,
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
    return { ok: false, error: "Room not found" };
  }
  if (room.hostId !== participantId) {
    return { ok: false, error: "Only the host can start the game" };
  }
  if (room.participants.length < 2) {
    return { ok: false, error: "At least 2 players are required to start" };
  }

  room.status = "playing";
  room.currentRound = 1;
  room.currentWord = STARTER_WORDS[0];

  for (const participant of room.participants) {
    participant.role = participant.id === room.hostId ? "drawer" : "guesser";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(
  room: Room,
  viewerParticipantId?: string,
): RoomSnapshot {
  const drawerId = room.participants.find(
    (participant) => participant.role === "drawer",
  )?.id;
  const isDrawer =
    viewerParticipantId !== undefined && drawerId === viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    currentWord: isDrawer && room.currentWord ? room.currentWord : null,
    currentWordLength: room.currentWord?.length ?? 0,
    currentRound: room.currentRound ?? 0,
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
  };
}
