import { randomUUID } from "node:crypto";
import type { CanvasAction, Participant, Room, RoomSnapshot } from "../models/game.js";
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

export function djb2Hash(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function selectSecretWord(code: string): string {
  if ((STARTER_WORDS as readonly string[]).length === 0) {
    throw new HttpError(400, "No words available to start the game");
  }

  const hash = djb2Hash(code);
  const index = hash % STARTER_WORDS.length;
  return STARTER_WORDS[index];
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
    drawerId: "",
    secretWord: "",
    participants: [participant],
    canvasActions: [],
    guessHistory: [],
    scores: {},
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can restart the round");
  }

  if (room.status !== "results") {
    throw new HttpError(400, "Room is not in results status");
  }

  room.status = "lobby";
  room.secretWord = "";
  room.drawerId = "";
  room.scores = {};
  room.guessHistory = [];
  room.canvasActions = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are required to start");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectSecretWord(room.code);
  room.scores = {};
  for (const p of room.participants) {
    if (p.id !== room.drawerId) {
      room.scores[p.id] = 0;
    }
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const resolvedName = displayName(playerName);

  if (room.participants.some((p) => p.name === resolvedName)) {
    throw new HttpError(409, "Display name is already taken in this room");
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

export function joinRoomById(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const existing = room.participants.find((p) => p.id === participantId);

  if (existing) {
    room.updatedAt = now();
    return {
      room: cloneRoom(room),
      participantId: existing.id
    };
  }

  return null;
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function getRooms() {
  return rooms;
}

export function deleteRoom(code: string) {
  rooms.delete(code);
}

export interface GuessResult {
  correct: boolean;
  score: number;
  guessId: string;
}

export function submitGuess(room: Room, participantId: string, text: string): GuessResult {
  if (participantId === room.drawerId) {
    throw new HttpError(403, "The drawer cannot submit guesses");
  }

  if ((room.scores[participantId] ?? 0) >= 100) {
    throw new HttpError(400, "You have already scored 100 points this round");
  }

  const trimmed = text.trim();
  const correct = trimmed.toLowerCase() === room.secretWord.toLowerCase();
  const score = correct ? 100 : 0;
  const guessId = randomUUID();

  if (correct) {
    room.scores[participantId] = 100;

    const allGuessersScored = room.participants
      .filter((p) => p.id !== room.drawerId)
      .every((p) => (room.scores[p.id] ?? 0) >= 100);

    if (allGuessersScored) {
      room.status = "results";
    }
  } else if (!room.scores[participantId]) {
    room.scores[participantId] = 0;
  }

  room.guessHistory.push({
    id: guessId,
    participantId,
    text: trimmed,
    correct,
    timestamp: now()
  });

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { correct, score, guessId };
}

export function appendCanvasAction(room: Room, action: CanvasAction) {
  room.canvasActions.push(action);
  room.updatedAt = now();
  rooms.set(room.code, room);
}

export function clearCanvas(room: Room, timestamp: string) {
  room.canvasActions = [{ type: "clear", timestamp }];
  room.updatedAt = now();
  rooms.set(room.code, room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;

  const allGuessersScored = room.participants
    .filter((p) => p.id !== room.drawerId)
    .every((p) => (room.scores[p.id] ?? 0) >= 100);

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    ...(isDrawer || room.status === "results" ? { secretWord: room.secretWord } : {}),
    canvasActions: [...room.canvasActions],
    guessHistory: [...room.guessHistory],
    scores: { ...room.scores },
    roundOver: room.status === "results" || (room.status === "playing" && room.participants.length > 1 && allGuessersScored)
  };
}
