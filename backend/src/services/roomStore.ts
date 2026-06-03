import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, Stroke, Guess } from "../models/game.js";
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
    name: name.trim(),
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function selectWordForRound(roundNumber: number): string | null {
  const words = STARTER_WORDS as readonly string[];
  if (words.length === 0) return null;
  return STARTER_WORDS[(roundNumber - 1) % words.length];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    drawerId: null,
    currentWord: null,
    strokes: [],
    guesses: [],
    playerScores: new Map(),
    hasScored: [],
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
  if (room.status === "active") {
    room.playerScores.set(participant.id, 0);
  }
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;
  const isResults = room.status === "results";

  const playerScoresDisplay = Array.from(room.playerScores.entries()).map(([playerId, score]) => {
    const participant = room.participants.find((p) => p.id === playerId);
    return { playerId, score, name: participant?.name ?? "Unknown" };
  });

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.drawerId ?? null,
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    currentWord: isResults || isDrawer ? room.currentWord : null,
    strokes: [...room.strokes],
    guesses: [...room.guesses],
    playerScores: playerScoresDisplay
  };
}

export function startRoom(code: string): RoomSnapshot | null {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.status = "active";
  room.drawerId = room.hostId;
  room.currentWord = selectWordForRound(1);
  room.strokes = [];
  room.guesses = [];
  room.playerScores = new Map(room.participants.map((p) => [p.id, 0]));
  room.hasScored = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room), room.drawerId);
}

export function addStroke(code: string, stroke: Omit<Stroke, "id" | "playerId">, drawerId: string): RoomSnapshot | null {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const newStroke: Stroke = {
    id: randomUUID(),
    playerId: drawerId,
    points: stroke.points,
    color: stroke.color,
    lineWidth: stroke.lineWidth
  };

  room.strokes.push(newStroke);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function clearCanvas(code: string, drawerId: string): RoomSnapshot | null {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function submitGuess(code: string, participantId: string, playerName: string, text: string): { snapshot: RoomSnapshot | null; correct: boolean } {
  const room = rooms.get(code);

  if (!room) {
    return { snapshot: null, correct: false };
  }

  const trimmedText = text.trim();
  const isCorrect = trimmedText.toLowerCase() === room.currentWord?.toLowerCase();
  const alreadyScored = room.hasScored.includes(participantId);

  if (isCorrect && !alreadyScored) {
    const currentScore = room.playerScores.get(participantId) ?? 0;
    room.playerScores.set(participantId, currentScore + 100);
    room.hasScored.push(participantId);
  }

  const guess: Guess = {
    id: randomUUID(),
    playerId: participantId,
    playerName,
    text: trimmedText,
    correct: isCorrect,
    timestamp: now()
  };

  room.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { snapshot: toRoomSnapshot(cloneRoom(room)), correct: isCorrect };
}

export function endRound(code: string): RoomSnapshot | null {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "active") {
    return null;
  }

  room.status = "results";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}

export function restartRoom(code: string): RoomSnapshot | null {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.status = "lobby";
  room.drawerId = null;
  room.currentWord = null;
  room.strokes = [];
  room.guesses = [];
  room.playerScores = new Map(room.participants.map((p) => [p.id, 0]));
  room.hasScored = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return toRoomSnapshot(cloneRoom(room));
}
