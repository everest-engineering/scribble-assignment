import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export const MAX_PARTICIPANTS = 8;

export class PlayerNameValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlayerNameValidationError";
  }
}

export class RoomCapacityError extends Error {
  constructor() {
    super("Room is full");
    this.name = "RoomCapacityError";
  }
}

export class StartNotHostError extends Error {
  constructor() {
    super("Only the host can start the game");
    this.name = "StartNotHostError";
  }
}

export class StartInvalidStateError extends Error {
  constructor() {
    super("Game has already started");
    this.name = "StartInvalidStateError";
  }
}

export class StartInsufficientPlayersError extends Error {
  constructor() {
    super("Need at least 2 players to start");
    this.name = "StartInsufficientPlayersError";
  }
}

export function sumCharCodes(code: string) {
  let sum = 0;

  for (const character of code) {
    sum += character.charCodeAt(0);
  }

  return sum;
}

export function pickWord(code: string, roundIndex: number) {
  const index = (sumCharCodes(code) + roundIndex) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

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

export function normalizePlayerName(name?: string) {
  const trimmed = (name ?? "").trim();

  if (!trimmed) {
    throw new PlayerNameValidationError("Player name is required");
  }

  if (trimmed.length > 24) {
    throw new PlayerNameValidationError("Player name must be 24 characters or fewer");
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

export function createRoom(playerName?: string) {
  const name = normalizePlayerName(playerName);
  const participant = createParticipant(name);
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

  if (room.participants.length >= MAX_PARTICIPANTS) {
    throw new RoomCapacityError();
  }

  const name = normalizePlayerName(playerName);
  const participant = createParticipant(name);
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

export function startRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (participantId !== room.hostParticipantId) {
    throw new StartNotHostError();
  }

  if (room.status !== "lobby") {
    throw new StartInvalidStateError();
  }

  if (room.participants.length < 2) {
    throw new StartInsufficientPlayersError();
  }

  const drawerParticipantId = room.participants[0].id;
  const secretWord = pickWord(room.code, 0);

  room.status = "playing";
  room.currentRound = {
    roundIndex: 0,
    drawerParticipantId,
    secretWord
  };
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return getRoom(room.code);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.currentRound) {
    const isDrawer = viewerParticipantId === room.currentRound.drawerParticipantId;

    snapshot.currentRound = {
      roundIndex: room.currentRound.roundIndex,
      drawerParticipantId: room.currentRound.drawerParticipantId,
      secretWord: isDrawer ? room.currentRound.secretWord : null
    };

    if (viewerParticipantId) {
      snapshot.viewer = {
        participantId: viewerParticipantId,
        isDrawer
      };
    }
  }

  return snapshot;
}
