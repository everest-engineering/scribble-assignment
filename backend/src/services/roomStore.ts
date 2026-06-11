import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

export const MAX_PARTICIPANTS = 8;

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

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
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
  const room = rooms.get(code.toUpperCase());

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
  const room = rooms.get(code.toUpperCase());
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    return null;
  }

  if (room.hostId !== participantId) {
    return null;
  }

  if (room.participants.length < 2) {
    return null;
  }

  room.status = "playing";

  const drawerIndex = room.participants.findIndex((p) => p.id !== room.hostId);
  room.participants.forEach((p, index) => {
    p.role = index === drawerIndex ? "drawer" : "guesser";
  });

  room.secretWord = STARTER_WORDS[0];
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return false;
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return false;
  }

  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    rooms.delete(room.code);
    return true;
  }

  if (room.hostId === participantId) {
    room.hostId = room.participants.reduce((earliest, p) =>
      p.joinedAt < earliest.joinedAt ? p : earliest
    ).id;
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return true;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const participants = room.participants.map((p) => {
    const { ...rest } = p;
    return rest;
  });

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants,
    hostId: room.hostId,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "playing" && viewerParticipantId) {
    const viewer = room.participants.find((p) => p.id === viewerParticipantId);
    if (viewer?.role === "drawer") {
      snapshot.secretWord = room.secretWord;
    }
  }

  return snapshot;
}
