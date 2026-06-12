import { randomUUID } from "node:crypto";
import type { Participant, ParticipantSnapshot, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

function deterministicPick<T>(items: readonly T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const index = Math.abs(hash) % items.length;
  return items[index];
}

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

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    hostId: participant.id,
    status: "lobby",
    participants: [participant],
    guesses: [],
    scores: {},
    roundResult: null,
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export type JoinRoomError = "not_found" | "game_in_progress";

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "not_found" as const };
  }

  if (room.status !== "lobby") {
    return { error: "game_in_progress" as const };
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game already in progress");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are required to start");
  }

  room.status = "playing";
  room.word = deterministicPick(STARTER_WORDS, room.code);
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.roundResult = null;
  for (const participant of room.participants) {
    participant.role = participant.id === room.hostId ? "drawer" : "guesser";
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    throw new HttpError(404, "Participant not found");
  }

  const leavingParticipant = room.participants[index];

  if (leavingParticipant.role === "drawer" && room.status === "playing") {
    room.status = "finished";
    room.roundResult = {
      secretWord: room.word ?? "",
      guessHistory: [...(room.guesses ?? [])],
      scores: { ...(room.scores ?? {}) },
      winnerId: null,
      endedAt: now()
    };
  }

  room.participants.splice(index, 1);
  room.updatedAt = now();

  if (room.participants.length === 0) {
    rooms.delete(code);
    return null;
  }

  if (leavingParticipant.id === room.hostId) {
    room.hostId = room.participants[0].id;
  }

  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isPlayingOrFinished = room.status === "playing" || room.status === "finished";

  const viewer = room.participants.find((p) => p.id === viewerParticipantId);
  const isViewerDrawer = viewer?.role === "drawer";

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      joinedAt: participant.joinedAt,
      isHost: participant.id === room.hostId,
      role: isPlayingOrFinished ? (participant.role ?? null) : null
    })) satisfies ParticipantSnapshot[],
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    guesses: room.guesses ?? [],
    scores: room.scores ?? {},
    roundResult: room.roundResult ?? null
  };

  if (room.status === "finished" && room.word) {
    snapshot.word = room.word;
  } else if (isViewerDrawer && room.word) {
    snapshot.word = room.word;
  }

  return snapshot;
}

export function resetRoomToLobby(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can restart the game");
  }

  if (room.status !== "finished") {
    throw new HttpError(400, "Game is not finished");
  }

  room.status = "lobby";
  room.word = undefined;
  room.guesses = [];
  room.scores = {};
  room.roundResult = null;
  room.canvasState = null;

  for (const p of room.participants) {
    p.role = undefined;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}
