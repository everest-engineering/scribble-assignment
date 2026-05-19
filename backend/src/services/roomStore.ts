import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Round } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const MAX_ROOMS = 100;
const MAX_PARTICIPANTS = 8;

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

export function selectWord(code: string, wordList: readonly string[]): string {
  const hash = code.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return wordList[hash % wordList.length];
}

export function createRoom(playerName?: string) {
  if (rooms.size >= MAX_ROOMS) {
    return null;
  }

  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    currentRound: null,
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

  if (room.status !== "lobby") {
    return null;
  }

  if (room.participants.length >= MAX_PARTICIPANTS) {
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

export function startGame(code: string, participantId: string): Room | null {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    return null;
  }

  if (room.participants.length < 2) {
    return null;
  }

  const validName = (name: string) => /^[a-zA-Z0-9]+$/.test(name.trim()) && name.trim().length >= 1 && name.trim().length <= 16;

  for (const participant of room.participants) {
    if (!validName(participant.name)) {
      return null;
    }
  }

  if ((STARTER_WORDS as readonly string[]).length === 0) {
    return null;
  }

  const word = selectWord(room.code, STARTER_WORDS);
  const round: Round = {
    number: 1,
    drawerId: room.hostId,
    secretWord: word,
    status: "drawing"
  };

  room.currentRound = round;
  room.status = "active";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function removeParticipant(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return;
  }

  room.participants = room.participants.filter((p) => p.id !== participantId);
  room.updatedAt = now();

  if (room.participants.length === 0) {
    rooms.delete(code);
  } else {
    rooms.set(room.code, room);
  }
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = room.currentRound !== null && viewerParticipantId !== undefined && viewerParticipantId === room.currentRound.drawerId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    currentRound: room.currentRound
      ? {
          number: room.currentRound.number,
          drawerId: room.currentRound.drawerId,
          secretWord: isDrawer ? room.currentRound.secretWord : undefined,
          status: room.currentRound.status
        }
      : null,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
