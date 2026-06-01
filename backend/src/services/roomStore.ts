import { randomUUID } from "node:crypto";
import type { CurrentRound, Participant, Room, RoomSnapshot, ViewerRole } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

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

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: name || "Player",
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function selectWord(code: string, wordList?: readonly string[]): string {
  const words = wordList ?? STARTER_WORDS;

  if (words.length === 0) {
    throw new HttpError(400, "No starter words available");
  }

  let hash = 0;
  for (let index = 0; index < code.length; index += 1) {
    hash = code.charCodeAt(index) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % words.length;
  return words[index];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostParticipantId: participant.id,
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
  const normalized = normalizeCode(code);
  const room = rooms.get(normalized);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
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
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

function selectDrawer(room: Room): Participant {
  if (room.hostParticipantId) {
    const hostParticipant = room.participants.find((p) => p.id === room.hostParticipantId);
    if (hostParticipant) {
      return hostParticipant;
    }
  }

  const sorted = [...room.participants].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
  const earliest = sorted[0];

  if (!earliest) {
    throw new HttpError(400, "No participants available to assign as drawer");
  }

  return earliest;
}

export function startGame(code: string, participantId: string) {
  const normalized = normalizeCode(code);
  const room = rooms.get(normalized);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game has already started");
  }

  if (room.hostParticipantId !== null && room.hostParticipantId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are needed to start");
  }

  if (!room.participants.some((p) => p.id === participantId)) {
    throw new HttpError(404, "Participant not found in room");
  }

  const word = selectWord(room.code);
  const drawer = selectDrawer(room);

  const currentRound: CurrentRound = {
    roundNumber: 1,
    drawerParticipantId: drawer.id,
    secretWord: word,
    startedAt: now()
  };

  room.status = "inGame";
  room.currentRound = currentRound;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isHost = viewerParticipantId ? room.hostParticipantId === viewerParticipantId : false;
  const canStart = isHost && room.status === "lobby" && room.participants.length >= 2;

  let viewerRole: ViewerRole = "unknown";
  let isDrawer = false;

  if (room.currentRound && viewerParticipantId) {
    isDrawer = room.currentRound.drawerParticipantId === viewerParticipantId;
    viewerRole = isDrawer ? "drawer" : "guesser";
  } else if (viewerParticipantId) {
    viewerRole = room.participants.some((p) => p.id === viewerParticipantId) ? "guesser" : "unknown";
  }

  const drawerParticipant = room.currentRound
    ? room.participants.find((p) => p.id === room.currentRound!.drawerParticipantId)
    : undefined;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostParticipantId: room.hostParticipantId,
    viewerParticipantId: viewerParticipantId ?? null,
    isHost,
    canStart,
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    currentRound: room.currentRound
      ? {
          roundNumber: room.currentRound.roundNumber,
          drawerParticipantId: room.currentRound.drawerParticipantId,
          drawerName: drawerParticipant?.name ?? "Unknown"
        }
      : undefined,
    viewerRole,
    isDrawer,
    secretWord: isDrawer && room.currentRound ? room.currentRound.secretWord : undefined
  };

  if (!isDrawer) {
    delete snapshot.secretWord;
  }

  return snapshot;
}
