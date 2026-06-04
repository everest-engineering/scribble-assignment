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
    drawerIndex: 0,
    canvasData: "",
    guesses: [],
    scores: { [participant.id]: 0 },
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("At least 2 players are required to start");
  }

  room.status = "playing";
  room.drawerIndex = 0;
  room.drawerId = room.participants[room.drawerIndex].id;
  room.secretWord = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function nextRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.hostId !== participantId) {
    throw new Error("Only the host can start the next round");
  }

  room.status = "playing";
  room.drawerIndex = (room.drawerIndex + 1) % room.participants.length;
  room.drawerId = room.participants[room.drawerIndex].id;
  room.secretWord = STARTER_WORDS[Math.floor(Math.random() * STARTER_WORDS.length)];
  room.canvasData = "";
  room.guesses = [];
  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function updateCanvas(code: string, participantId: string, data: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.drawerId !== participantId) {
    throw new Error("Only the drawer can update the canvas");
  }

  room.canvasData = data;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.drawerId === participantId) {
    throw new Error("Drawers cannot submit guesses");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) throw new Error("Participant not found");

  const isCorrect = text.trim().toLowerCase() === room.secretWord?.toLowerCase();

  room.guesses.push({
    playerId: participantId,
    playerName: participant.name,
    text: text.trim(),
    isCorrect,
    timestamp: now()
  });

  if (isCorrect) {
    room.scores[participantId] = (room.scores[participantId] || 0) + 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.hostId !== participantId) {
    throw new Error("Only the host can end the round");
  }

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) return null;
  if (room.hostId !== participantId) {
    throw new Error("Only the host can restart the game");
  }

  room.status = "lobby";
  room.drawerIndex = 0;
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.canvasData = "";
  room.guesses = [];
  for (const id in room.scores) {
    room.scores[id] = 0;
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = room.drawerId === viewerParticipantId;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    secretWord: isDrawer ? room.secretWord : undefined,
    isDrawer,
    canvasData: room.canvasData,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores }
  };
}
