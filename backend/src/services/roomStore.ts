import { randomUUID } from "node:crypto";
import type {
  Participant,
  ParticipantView,
  Room,
  RoomSnapshot,
  RoundView
} from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

export function selectWordForRound(
  words: readonly string[],
  roundNumber: number
): string {
  if (words.length === 0) {
    throw new Error("No words available");
  }
  return words[(roundNumber - 1) % words.length];
}

function buildMaskedWord(secretWord: string): string {
  return secretWord.replace(/[^ ]/g, "_");
}

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
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
    name: name.trim(),
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
    hostParticipantId: participant.id,
    round: null,
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
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export type StartRoomOutcome =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_enough_players" };

export function startRoom(code: string, requesterId: string): StartRoomOutcome {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.hostParticipantId !== requesterId) {
    return { ok: false, reason: "not_host" };
  }

  // Idempotency: if a round already exists, return the existing room unchanged.
  if (room.round !== null) {
    return { ok: true, room: cloneRoom(room) };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "not_enough_players" };
  }

  room.round = {
    roundNumber: 1,
    drawerParticipantId: room.hostParticipantId,
    secretWord: selectWordForRound(STARTER_WORDS, 1)
  };
  room.status = "round";
  room.updatedAt = now();

  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerIsHost =
    Boolean(viewerParticipantId) && viewerParticipantId === room.hostParticipantId;

  const drawerId = room.round?.drawerParticipantId ?? null;

  const participants: ParticipantView[] = room.participants.map((participant) => ({
    ...participant,
    isHost: participant.id === room.hostParticipantId,
    isDrawer: drawerId !== null && participant.id === drawerId
  }));

  let round: RoundView | null = null;
  if (room.round !== null) {
    const viewerIsDrawer =
      viewerParticipantId !== undefined &&
      viewerParticipantId === room.round.drawerParticipantId;

    round = {
      roundNumber: room.round.roundNumber,
      drawerParticipantId: room.round.drawerParticipantId,
      maskedWord: buildMaskedWord(room.round.secretWord)
    };

    if (viewerIsDrawer) {
      round.secretWord = room.round.secretWord;
    }
  }

  return {
    code: room.code,
    status: room.status,
    participants,
    hostParticipantId: room.hostParticipantId,
    viewerIsHost,
    canStart: viewerIsHost && room.round === null && room.participants.length >= 2,
    // In-round, hide the cleartext word list from non-drawer payloads (FR-005).
    // Drawers already see the secret word; we still empty the list to keep the wire shape uniform across viewers.
    availableWords: room.round === null ? listWords() : [],
    roles: [...STARTER_ROLES],
    round
  };
}

export function __resetRoomsForTests() {
  rooms.clear();
}
