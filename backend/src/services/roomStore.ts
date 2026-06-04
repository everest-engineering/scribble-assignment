import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function selectWord(code: string): string {
  let index = 0;
  for (let i = 0; i < code.length; i++) {
    index += code.charCodeAt(i);
  }
  const words = listWords();
  return words[index % words.length];
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
    drawerId: "",
    secretWord: "",
    round: 0,
    participants: [participant],
    guesses: [],
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

export function joinRoom(code: string, playerName: string) {
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

  room.drawerId = room.hostId;
  room.secretWord = selectWord(room.code);
  room.round = 1;
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
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

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.status !== "playing") {
    throw new HttpError(400, "Game is not in progress");
  }

  if (room.drawerId === participantId) {
    throw new HttpError(400, "Drawer cannot submit guesses");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(404, "Participant not found in room");
  }

  const trimmed = text.trim();
  const isCorrect = trimmed.toLowerCase() === room.secretWord.toLowerCase();
  const alreadyCorrect = (room.scores[participantId] ?? 0) >= 100;

  if (isCorrect) {
    if (!alreadyCorrect) {
      room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    }
    room.status = "result";
  }

  if (!isCorrect && !room.scores[participantId]) {
    room.scores[participantId] = 0;
  }

  const guess: Guess = {
    participantId,
    playerName: participant.name,
    text,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
  };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  if (room.hostId !== participantId) {
    throw new HttpError(403, "Only the host can restart the game");
  }

  room.drawerId = "";
  room.secretWord = "";
  room.round = 0;
  room.guesses = [];
  room.scores = {};
  room.status = "lobby";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId === room.drawerId;

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer ? room.secretWord : undefined,
    round: room.round,
    participants: room.participants.map((participant) => ({ ...participant })),
    guesses: room.guesses.map((guess) => ({ ...guess })),
    scores: { ...room.scores },
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  if (room.status === "result") {
    snapshot.correctWord = room.secretWord;
  }

  return snapshot;
}
