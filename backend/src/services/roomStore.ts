import { randomUUID } from "node:crypto";
import { HttpError } from "../api/schemas.js";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function createParticipant(name?: string): Participant {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    throw new HttpError(400, "Player name is required");
  }
  return {
    id: randomUUID(),
    name: trimmed,
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
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    guesses: [],
    scores: {},
    canvasData: null,
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

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Unable to load room");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(409, "At least 2 players are required to start");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[0];
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.canvasData = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: toRoomSnapshot(cloneRoom(room), participantId) };
}

export function updateCanvas(code: string, participantId: string, canvasData: string | null): RoomSnapshot {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Unable to load room");
  }

  if (participantId !== room.drawerId) {
    throw new HttpError(403, "Only the drawer can update the canvas");
  }

  room.canvasData = canvasData;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room), participantId);
}

export function submitGuess(code: string, participantId: string, guessText: string): RoomSnapshot {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Unable to load room");
  }

  const trimmed = guessText.trim();
  if (!trimmed) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  if (participantId === room.drawerId) {
    throw new HttpError(403, "Drawer cannot submit guesses");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(403, "Participant not found in this room");
  }

  const correct = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();

  const guess: Guess = {
    participantId,
    participantName: participant.name,
    text: trimmed,
    correct,
    submittedAt: now()
  };

  room.guesses.push(guess);

  if (correct) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
  }

  saveRoom(room);
  return toRoomSnapshot(cloneRoom(room), participantId);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.drawerId,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    canvasData: room.canvasData,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.drawerId && viewerParticipantId === room.drawerId) {
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}
