import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

type StartGameResult =
  | {
      ok: true;
      room: Room;
    }
  | {
      ok: false;
      statusCode: number;
      message: string;
    };

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

function displayName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Player name is required");
  }

  return trimmedName;
}

function createParticipant(name: string, isHost = false): Participant {
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

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    hostId: participant.id,
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

export function joinRoom(code: string, playerName: string) {
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

export function startGame(code: string, participantId: string): StartGameResult {
  const room = rooms.get(code);

  if (!room) {
    return {
      ok: false,
      statusCode: 404,
      message: "Unable to load room"
    };
  }

  if (room.status !== "lobby" || room.currentRound) {
    return {
      ok: false,
      statusCode: 409,
      message: "Game has already started"
    };
  }

  if (room.participants.length < 2) {
    return {
      ok: false,
      statusCode: 409,
      message: "At least 2 players are required to start the game"
    };
  }

  const host = room.participants.find((participant) => participant.id === room.hostId);
  const drawer = host ?? room.participants[0];
  const requesterCanStart = participantId === drawer.id && (!host || participantId === host.id);

  if (!requesterCanStart) {
    return {
      ok: false,
      statusCode: 403,
      message: "Only the host can start the game"
    };
  }

  room.status = "inProgress";
  room.currentRound = {
    roundNumber: 1,
    status: "active",
    drawerId: drawer.id,
    secretWord: STARTER_WORDS[0],
    startedAt: now()
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    ok: true,
    room: cloneRoom(room)
  };
}

export function toRoomSnapshot(room: Room, viewerId?: string): RoomSnapshot {
  const drawer = room.currentRound
    ? room.participants.find((participant) => participant.id === room.currentRound?.drawerId)
    : undefined;

  return {
    code: room.code,
    hostId: room.hostId,
    gameState: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    ...(room.currentRound && drawer
      ? {
          currentRound: {
            roundNumber: room.currentRound.roundNumber,
            status: room.currentRound.status,
            drawerId: room.currentRound.drawerId,
            drawerName: drawer.name,
            ...(viewerId === room.currentRound.drawerId ? { secretWord: room.currentRound.secretWord } : {})
          }
        }
      : {})
  };
}
