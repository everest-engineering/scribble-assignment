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

function createParticipant(name: string, isHost: boolean): Participant {
  return {
    id: randomUUID(),
    name,
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
    status: "lobby",
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    guesses: [],
    scores: {},
    strokes: []
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

export function startGame(code: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status === "playing") {
    throw new HttpError(409, "Game has already started");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "At least 2 players are required to start");
  }

  for (const participant of room.participants) {
    if (participant.name.trim() === "") {
      throw new HttpError(400, "All player names must be non-empty");
    }
  }

  room.drawerName = room.participants[0].name;
  room.secretWord = STARTER_WORDS[0];
  room.status = "playing";
  room.guesses = [];
  room.scores = {};
  room.strokes = [];

  return saveRoom(room)!;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    strokes: room.strokes.map((stroke) => stroke.map((p) => ({ ...p })))
  };

  if (room.status === "playing" && room.drawerName !== undefined) {
    snapshot.drawerName = room.drawerName;

    const viewer = viewerParticipantId
      ? room.participants.find((p) => p.id === viewerParticipantId)
      : undefined;

    if (viewer?.name === room.drawerName) {
      snapshot.secretWord = room.secretWord;
    }
  }

  if (room.status === "result") {
    snapshot.drawerName = room.drawerName;
    snapshot.secretWord = room.secretWord;
  }

  return snapshot;
}

export function endGame(code: string, playerName: string): Room {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(409, "Room is not in playing state");
  }

  if (playerName !== room.participants[0].name) {
    throw new HttpError(403, "Only the host can end the game");
  }

  room.status = "result";

  return saveRoom(room)!;
}

export function restartGame(code: string, playerName: string): Room {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "result") {
    throw new HttpError(409, "Room is not in result state");
  }

  if (playerName !== room.participants[0].name) {
    throw new HttpError(403, "Only the host can restart the game");
  }

  room.status = "lobby";
  room.secretWord = undefined;
  room.drawerName = undefined;
  room.guesses = [];
  room.scores = {};
  room.strokes = [];

  return saveRoom(room)!;
}

export function submitGuess(code: string, playerName: string, guessText: string): Guess {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Room is not in playing state");
  }

  const trimmed = guessText.trim();

  if (trimmed === "") {
    throw new HttpError(400, "Guess cannot be empty");
  }

  const correct = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();
  const points = correct ? 100 : 0;

  const guess: Guess = {
    playerName,
    text: trimmed,
    correct,
    points,
    submittedAt: new Date().toISOString()
  };

  room.guesses.push(guess);
  room.scores[playerName] = (room.scores[playerName] ?? 0) + points;
  saveRoom(room);

  return guess;
}

export function addStroke(code: string, points: Point[]): Point[][] {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Room is not in playing state");
  }

  room.strokes.push(points);
  saveRoom(room);

  return room.strokes.map((stroke) => stroke.map((p) => ({ ...p })));
}

export function clearStrokes(code: string): Point[][] {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Room is not in playing state");
  }

  room.strokes = [];
  saveRoom(room);

  return [];
}
