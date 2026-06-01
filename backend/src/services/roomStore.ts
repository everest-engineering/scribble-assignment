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

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    isHost,
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function selectSecretWord(room: Room) {
  const seed = [...room.code, room.createdAt]
    .flatMap((character) => character.codePointAt(0) ?? 0)
    .reduce((sum, code) => sum + code, 0);

  return STARTER_WORDS[seed % STARTER_WORDS.length];
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
    updatedAt: now(),
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id,
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName, false);
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

export function startRoom(room: Room, participantId: string) {
  const host = room.participants.find((participant) => participant.isHost);

  if (!host || host.id !== participantId) {
    throw new Error("Only the host may start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("At least two players are required to start the game");
  }

  if (room.status === "active") {
    return room;
  }

  const drawer = host || room.participants[0];
  room.drawerId = drawer.id;
  room.secretWord = selectSecretWord(room);
  room.status = "active";

  return saveRoom(room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  const savedRoom = cloneRoom(room);
  rooms.set(room.code, savedRoom);
  return savedRoom;
}

export function toRoomSnapshot(
  room: Room,
  viewerParticipantId?: string,
): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: room.drawerId,
    secretWord: room.drawerId === viewerParticipantId ? room.secretWord : undefined,
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
  };
}
