import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
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
    currentWord: null,
    canvasData: null,
    guessHistory: [],
    scoreboard: {},
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

  if (room.participants.length >= 8) {
    throw new Error("Room is full (max 8 players)");
  }

  if (room.status === "in-game") {
    throw new Error("Cannot join a game in progress");
  }

  const normalizedName = (playerName || "Player").trim();
  if (room.participants.some(p => p.name.toLowerCase() === normalizedName.toLowerCase())) {
    throw new Error("Name already taken in this room");
  }

  const participant = createParticipant(normalizedName);
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

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return;

  if (room.hostId === participantId) {
    rooms.delete(code);
    return;
  }

  const index = room.participants.findIndex(p => p.id === participantId);
  if (index !== -1) {
    room.participants.splice(index, 1);
    room.updatedAt = now();
    rooms.set(code, room);
  }
}

export function startGame(code: string, hostId: string) {
  const room = rooms.get(code);
  if (!room || room.status !== "lobby" || room.hostId !== hostId) {
    throw new Error("Cannot start game");
  }

  const words = listWords();
  const wordIndex = room.code.length % words.length;

  room.status = "in-game";
  room.drawerId = room.hostId;
  room.currentWord = words[wordIndex];
  room.canvasData = null;
  room.guessHistory = [];
  room.scoreboard = room.participants.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {});
  room.updatedAt = now();
  rooms.set(code, room);

  return saveRoom(room);
}

export function checkAutomaticCompletion(room: Room) {
  if (room.status !== "in-game") return;

  const guessers = room.participants.filter(p => p.id !== room.drawerId);
  const correctGuessers = new Set(
    room.guessHistory
      .filter(g => g.isCorrect)
      .map(g => g.playerId)
  );

  if (guessers.length > 0 && guessers.every(g => correctGuessers.has(g.id))) {
    room.status = "ended";
    saveRoom(room);
  }
}

export function endGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room || room.status !== "in-game" || room.hostId !== participantId) {
    throw new Error("Unauthorized or invalid state");
  }
  room.status = "ended";
  return saveRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room || room.status !== "ended" || room.hostId !== participantId) {
    throw new Error("Unauthorized or invalid state");
  }

  room.status = "lobby";
  room.drawerId = null;
  room.currentWord = null;
  room.canvasData = null;
  room.guessHistory = [];
  room.scoreboard = {};
  return saveRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    isHost: room.hostId === viewerParticipantId,
    participants: room.participants.map((participant) => ({
      ...participant,
      isDrawer: participant.id === room.drawerId
    })),
    currentWord: (room.drawerId === viewerParticipantId || room.status === 'ended') ? room.currentWord : null,
    canvasData: room.canvasData,
    guessHistory: room.guessHistory,
    scoreboard: room.scoreboard
  };
}
