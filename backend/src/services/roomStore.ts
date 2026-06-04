import { randomUUID } from "node:crypto";
import type { DrawCommand, Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

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

function pickRandomWord(): string {
  const index = Math.floor(Math.random() * STARTER_WORDS.length);
  return STARTER_WORDS[index];
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
    drawCommands: [],
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

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.scores[participant.id] = 0;
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

export function startGame(code: string, hostId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== hostId) {
    return null;
  }

  if (room.participants.length < 2) {
    return null;
  }

  const drawerIndex = 0;
  room.drawerId = room.participants[drawerIndex].id;
  room.secretWord = pickRandomWord();
  room.guesses = [];
  room.drawCommands = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guess: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "playing") {
    return null;
  }

  if (participantId === room.drawerId) {
    return null;
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    return null;
  }

  const isCorrect = guess.toLowerCase() === room.secretWord?.toLowerCase();
  const guessEntry: Guess = {
    participantId,
    playerName: participant.name,
    text: guess,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guessEntry);

  if (isCorrect) {
    room.scores[participantId] = (room.scores[participantId] ?? 0) + 100;
    room.status = "finished";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { guess: guessEntry, room: cloneRoom(room) };
}

export function addDrawCommands(code: string, commands: DrawCommand[]) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "playing") {
    return null;
  }

  for (const cmd of commands) {
    if (cmd.type === "clear") {
      room.drawCommands = [];
    } else {
      room.drawCommands.push(cmd);
    }
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearDrawCommands(code: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.drawCommands = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, hostId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== hostId) {
    return null;
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.guesses = [];
  room.drawCommands = [];
  room.scores = {};
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((p) => ({ ...p })),
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: isDrawer ? room.secretWord : null,
    guesses: room.guesses.map((g) => ({ ...g })),
    drawCommands: room.drawCommands.map((c) => structuredClone(c)),
    scores: { ...room.scores }
  };
}
