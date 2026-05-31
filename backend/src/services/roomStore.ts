import { randomUUID } from "node:crypto";
import { HttpError, type Participant, type Room, type RoomSnapshot } from "../models/game.js";
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

function validateName(name?: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) {
    throw new HttpError(400, "Player name cannot be empty");
  }
  return trimmed;
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: validateName(name),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function selectWord(roomCode: string): string {
  const sum = roomCode.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STARTER_WORDS[sum % STARTER_WORDS.length];
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
    drawerId: null,
    secretWord: null,
    guesses: [],
    scores: {},
    strokes: [],
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

export function startGame(code: string, requesterId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game already started");
  }

  if (room.hostId !== requesterId) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "Need at least 2 players to start");
  }

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Round is over");
  }

  if (participantId === room.drawerId) {
    throw new HttpError(403, "Drawer cannot submit guesses");
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new HttpError(400, "Guess cannot be empty");
  }

  const isCorrect = trimmed.toLowerCase() === room.secretWord?.toLowerCase();
  const alreadyGuessedCorrectly = room.guesses.some(
    (g) => g.participantId === participantId && g.isCorrect
  );
  const scoreIncrement = isCorrect && !alreadyGuessedCorrectly ? 100 : 0;

  room.guesses.push({
    participantId,
    participantName: room.participants.find((p) => p.id === participantId)?.name ?? "Unknown",
    text: trimmed,
    isCorrect
  });

  room.scores[participantId] = (room.scores[participantId] ?? 0) + scoreIncrement;

  if (isCorrect) {
    const allGuessersCorrect = room.participants
      .filter((p) => p.id !== room.drawerId)
      .every((guesser) => room.guesses.some((g) => g.participantId === guesser.id && g.isCorrect));

    if (allGuessersCorrect) {
      room.status = "finished";
    }
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function saveStrokes(code: string, participantId: string, strokes: { points: { x: number; y: number }[] }[]) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (participantId !== room.drawerId) {
    throw new HttpError(403, "Only the drawer can draw");
  }

  room.strokes = strokes;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, requesterId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== requesterId) {
    throw new HttpError(403, "Only the host can restart the game");
  }

  if (room.status !== "finished") {
    throw new HttpError(400, "Game is not finished");
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.scores = {};
  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId === room.drawerId;
  const isFinished = room.status === "finished";
  const showSecret = isDrawer || isFinished;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: room.drawerId,
    secretWord: showSecret ? room.secretWord : null,
    guesses: [...room.guesses],
    scores: { ...room.scores },
    strokes: structuredClone(room.strokes),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
