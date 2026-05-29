import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";

const rooms = new Map<string, Room>();
const MINIMUM_PLAYERS_TO_START = 2;

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

type StartRoomResult =
  | { ok: true; room: Room }
  | { ok: false; reason: "not-found" | "forbidden" | "conflict"; message: string };

function canStartRoom(room: Room, viewerParticipantId?: string) {
  return (
    room.status === "lobby" &&
    room.participants.length >= MINIMUM_PLAYERS_TO_START &&
    room.hostParticipantId === viewerParticipantId
  );
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
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

export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      reason: "not-found",
      message: "Room code was not found"
    };
  }

  if (room.hostParticipantId !== participantId) {
    return {
      ok: false,
      reason: "forbidden",
      message: "Only the host can start the game"
    };
  }

  if (room.status !== "lobby") {
    return {
      ok: false,
      reason: "conflict",
      message: "Game has already started"
    };
  }

  if (room.participants.length < MINIMUM_PLAYERS_TO_START) {
    return {
      ok: false,
      reason: "conflict",
      message: `At least ${MINIMUM_PLAYERS_TO_START} players are required to start the game`
    };
  }

  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerIsHost = room.hostParticipantId === viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    viewerIsHost,
    canStartGame: canStartRoom(room, viewerParticipantId),
    minimumPlayersToStart: MINIMUM_PLAYERS_TO_START
  };
}
