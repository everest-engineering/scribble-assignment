import { randomUUID } from "node:crypto";
import type { Guess, Participant, Point, Room, RoomSnapshot } from "../models/game.js";
import { HttpError } from "../api/schemas.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

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

function displayName(name: string) {
  return name;
}

function createParticipant(name: string): Participant {
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

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
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

  if (room.status === "active") {
    return { error: "ROOM_ACTIVE" } as const;
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

export function addStroke(code: string, participantId: string, points: Point[]) {
  const room = rooms.get(code);
  if (!room) throw new HttpError(404, "Unable to load room");
  if (room.status !== "active") throw new HttpError(400, "Game is not active");
  if (participantId !== room.drawerId) throw new HttpError(403, "Only the drawer can draw");
  room.canvasStrokes!.push(points);
  saveRoom(room);
  return { ok: true };
}

export function clearCanvas(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) throw new HttpError(404, "Unable to load room");
  if (room.status !== "active") throw new HttpError(400, "Game is not active");
  if (participantId !== room.drawerId) throw new HttpError(403, "Only the drawer can clear the canvas");
  room.canvasStrokes = [];
  saveRoom(room);
  return { ok: true };
}

export function submitGuess(code: string, participantId: string, text: string): Guess {
  const room = rooms.get(code);
  if (!room) throw new HttpError(404, "Unable to load room");
  if (room.status !== "active") throw new HttpError(400, "Game is not active");
  if (participantId === room.drawerId) throw new HttpError(403, "The drawer cannot submit guesses");
  const isCorrect = text.toLowerCase() === (room.currentWord ?? "").toLowerCase();
  const guess: Guess = { participantId, text, isCorrect, submittedAt: now() };
  room.guesses!.push(guess);
  if (isCorrect) {
    room.scores![participantId] = (room.scores![participantId] ?? 0) + 100;
  }
  saveRoom(room);
  return guess;
}

export function startRoom(code: string, participantId: string): RoomSnapshot {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Unable to load room");
  }

  if (participantId !== room.hostId) {
    throw new HttpError(403, "Only the host can start");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "Need at least 2 players");
  }

  room.status = "active";
  room.drawerId = room.hostId;
  room.currentWord = STARTER_WORDS[0];
  room.canvasStrokes = [];
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  const saved = saveRoom(room)!;
  return toRoomSnapshot(saved);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    ...(room.drawerId && { drawerId: room.drawerId }),
    ...(room.currentWord && viewerParticipantId === room.drawerId && { currentWord: room.currentWord }),
    ...(room.canvasStrokes !== undefined && { canvasStrokes: room.canvasStrokes.map((s) => [...s]) }),
    ...(room.guesses !== undefined && { guesses: [...room.guesses] }),
    ...(room.scores !== undefined && { scores: { ...room.scores } }),
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
