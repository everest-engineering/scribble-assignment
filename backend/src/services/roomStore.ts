import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, RoundSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { selectWord } from "./wordSelection.js";

const rooms = new Map<string, Room>();

const MAX_PLAYERS = 8;
const PRESENCE_TIMEOUT_MS = 10_000;

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

// Names are validated (trimmed + non-empty) at the API layer (FR-010/FR-011),
// so create/join always pass a real name here. The trim + "Player" fallback
// remains only as a defensive default for any non-validated caller.
function displayName(name?: string) {
  const trimmed = (name ?? "").trim();
  return trimmed || "Player";
}

// Ensure each participant in a room is distinguishable (FR-017).
// On a case-insensitive collision, append " (2)", " (3)", ...
function disambiguateName(base: string, existing: Participant[]) {
  const taken = new Set(existing.map((participant) => participant.name.toLowerCase()));

  if (!taken.has(base.toLowerCase())) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base} (${suffix})`.toLowerCase())) {
    suffix += 1;
  }

  return `${base} (${suffix})`;
}

function createParticipant(name: string | undefined, existing: Participant[] = []): Participant {
  return {
    id: randomUUID(),
    name: disambiguateName(displayName(name), existing),
    joinedAt: now(),
    lastSeenAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

// Remove participants who have not polled within the presence window (FR-010a).
function pruneStaleParticipants(room: Room) {
  const nowMs = Date.now();
  room.participants = room.participants.filter(
    (participant) => nowMs - new Date(participant.lastSeenAt).getTime() <= PRESENCE_TIMEOUT_MS
  );
}

// Close a room when it is empty (FR-015a) or its host has departed (FR-015).
// Returns true if the room was deleted.
function closeIfEmptyOrHostGone(room: Room) {
  const hostPresent = room.participants.some((participant) => participant.id === room.hostId);

  if (room.participants.length === 0 || !hostPresent) {
    rooms.delete(room.code);
    return true;
  }

  return false;
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
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

export type JoinFailure = "not_found" | "started" | "full";

export function joinRoom(
  code: string,
  playerName?: string
): { room: Room; participantId: string } | { failure: JoinFailure } {
  const room = rooms.get(code);

  if (!room) {
    return { failure: "not_found" };
  }

  // Free up slots held by departed players before checking capacity.
  pruneStaleParticipants(room);
  if (closeIfEmptyOrHostGone(room)) {
    return { failure: "not_found" };
  }

  if (room.status === "playing") {
    return { failure: "started" };
  }

  if (room.participants.length >= MAX_PLAYERS) {
    return { failure: "full" };
  }

  const participant = createParticipant(playerName, room.participants);
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

// Polling read used by GET /rooms/:code — the poll doubles as a heartbeat:
// it refreshes the caller's presence, prunes stale players, and closes the
// room if the host left or everyone is gone. Returns null when the room is
// unknown or was closed (FR-010, FR-010a, FR-015, FR-015a).
export function pollRoom(code: string, viewerParticipantId?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (viewerParticipantId) {
    const viewer = room.participants.find((participant) => participant.id === viewerParticipantId);
    if (viewer) {
      viewer.lastSeenAt = now();
    }
  }

  pruneStaleParticipants(room);
  if (closeIfEmptyOrHostGone(room)) {
    return null;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export type StartFailure = "not_found" | "not_host" | "already_started" | "too_few";

export function startGame(
  code: string,
  participantId: string
): { room: Room } | { failure: StartFailure } {
  const room = rooms.get(code);

  if (!room) {
    return { failure: "not_found" };
  }

  // The requester is polling too; treat the start call as a heartbeat then prune.
  const requester = room.participants.find((participant) => participant.id === participantId);
  if (requester) {
    requester.lastSeenAt = now();
  }

  pruneStaleParticipants(room);
  if (closeIfEmptyOrHostGone(room)) {
    return { failure: "not_found" };
  }

  if (room.hostId !== participantId) {
    return { failure: "not_host" };
  }

  if (room.status === "playing") {
    return { failure: "already_started" };
  }

  if (room.participants.length < 2) {
    return { failure: "too_few" };
  }

  // Begin the first round: the host is the drawer (FR-002) and the secret word
  // is chosen deterministically from the starter list (FR-004, FR-005).
  room.status = "playing";
  room.round = {
    number: 1,
    drawerId: room.hostId,
    word: selectWord(room.code, 1)
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

// Project a room for a specific viewer. The secret word is included ONLY when
// the viewer is the drawer; every other viewer receives just the concealed
// blanks and the length, so the word never reaches a guesser (FR-006, FR-007).
function toRoundSnapshot(room: Room, viewerParticipantId?: string): RoundSnapshot | null {
  if (!room.round) {
    return null;
  }

  const { number, drawerId, word } = room.round;
  const maskedWord = Array.from(word, () => "_").join(" ");

  const snapshot: RoundSnapshot = {
    number,
    drawerId,
    wordLength: word.length,
    maskedWord
  };

  // Only the drawer is told the actual word.
  if (viewerParticipantId && viewerParticipantId === drawerId) {
    snapshot.word = word;
  }

  return snapshot;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    round: toRoundSnapshot(room, viewerParticipantId),
    roles: [...STARTER_ROLES]
  };
}
