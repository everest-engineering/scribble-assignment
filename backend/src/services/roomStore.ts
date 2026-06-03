import { randomUUID } from "node:crypto";
import { HttpError } from "../api/schemas.js";
import type {
  Participant,
  ParticipantRole,
  Room,
  RoomSnapshot,
  ViewerView
} from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const MIN_PLAYERS_TO_START = 2;

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
    joinedAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function requireRoom(code: string, notFoundMessage: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, notFoundMessage);
  }

  return room;
}

export function listWords() {
  return [...STARTER_WORDS];
}

/**
 * Deterministically pick a word from the starter list as a pure function of the
 * room code, so the same room always gets the same word (reproducible/testable).
 */
export function pickWord(code: string) {
  const charCodeSum = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return STARTER_WORDS[charCodeSum % STARTER_WORDS.length];
}

export function createRoom(playerName: string) {
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

export function joinRoom(code: string, playerName: string) {
  const room = requireRoom(code, "Room not found");
  const participant = createParticipant(playerName);

  room.participants.push(participant);
  room.updatedAt = now();

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  return requireRoom(code, "Room not found");
}

/**
 * Validate that the round can begin, assign the drawer (the host) and the
 * deterministic secret word, and move the room into "playing".
 */
export function startRound(code: string, participantId: string) {
  const room = requireRoom(code, "Room not found");

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < MIN_PLAYERS_TO_START) {
    throw new HttpError(400, "Need at least 2 players to start");
  }

  if (room.status !== "lobby") {
    throw new HttpError(409, "Game already started");
  }

  room.round = {
    drawerId: room.hostId,
    word: pickWord(room.code),
    strokes: [],
    guesses: [],
    winnerId: null
  };
  room.status = "playing";
  room.updatedAt = now();

  return cloneRoom(room);
}

function viewerRole(room: Room, participantId?: string): ParticipantRole | null {
  if (!participantId || !room.round) {
    return null;
  }

  return room.round.drawerId === participantId ? "drawer" : "guesser";
}

function buildViewer(room: Room, participantId?: string): ViewerView | null {
  if (!participantId) {
    return null;
  }

  const isMember = room.participants.some((participant) => participant.id === participantId);

  if (!isMember) {
    return null;
  }

  return {
    participantId,
    isHost: room.hostId === participantId,
    isDrawer: room.round?.drawerId === participantId,
    role: viewerRole(room, participantId)
  };
}

/** The word is secret: only the drawer sees it during play; everyone sees it in results. */
function wordForViewer(room: Room, participantId?: string): string | null {
  if (!room.round) {
    return null;
  }

  if (room.status === "results") {
    return room.round.word;
  }

  if (room.status === "playing" && room.round.drawerId === participantId) {
    return room.round.word;
  }

  return null;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      score: participant.score,
      isHost: room.hostId === participant.id,
      isDrawer: room.round?.drawerId === participant.id
    })),
    drawerId: room.round?.drawerId ?? null,
    guesses: room.round ? room.round.guesses.map((guess) => ({ ...guess })) : [],
    strokes: room.round ? structuredClone(room.round.strokes) : [],
    word: wordForViewer(room, viewerParticipantId),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    viewer: buildViewer(room, viewerParticipantId)
  };
}
