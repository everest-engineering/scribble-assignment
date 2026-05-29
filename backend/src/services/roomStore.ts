import { randomUUID } from "node:crypto";
import type { DrawingStroke, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function initialScores(participants: Participant[]) {
  return Object.fromEntries(participants.map((participant) => [participant.id, 0]));
}

function findParticipant(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId) ?? null;
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function selectWordForRoom(code: string) {
  const characterSum = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return STARTER_WORDS[characterSum % STARTER_WORDS.length];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    drawing: [],
    guesses: [],
    scores: {
      [participant.id]: 0
    },
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
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.hostId !== participantId) {
    return { ok: false as const, reason: "host-required" as const };
  }

  if (room.participants.length < 2) {
    return { ok: false as const, reason: "minimum-players" as const };
  }

  room.status = "game";
  room.drawerId = room.hostId;
  room.secretWord = selectWordForRoom(room.code);
  room.drawing = [];
  room.guesses = [];
  room.scores = initialScores(room.participants);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function updateDrawing(code: string, participantId: string, drawing: DrawingStroke[]) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.status !== "game") {
    return { ok: false as const, reason: "game-required" as const };
  }

  if (room.drawerId !== participantId) {
    return { ok: false as const, reason: "drawer-required" as const };
  }

  room.drawing = structuredClone(drawing);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function clearDrawing(code: string, participantId: string) {
  return updateDrawing(code, participantId, []);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.status !== "game" || !room.secretWord) {
    return { ok: false as const, reason: "game-required" as const };
  }

  const participant = findParticipant(room, participantId);

  if (!participant) {
    return { ok: false as const, reason: "participant-required" as const };
  }

  if (room.drawerId === participantId) {
    return { ok: false as const, reason: "guesser-required" as const };
  }

  const trimmedText = text.trim();

  if (!trimmedText) {
    return { ok: false as const, reason: "guess-required" as const };
  }

  const isCorrect = trimmedText.toLowerCase() === room.secretWord.toLowerCase();
  const alreadyCorrect = room.guesses.some((guess) => guess.participantId === participantId && guess.isCorrect);
  const pointsAwarded = isCorrect && !alreadyCorrect ? 100 : 0;

  room.guesses.push({
    id: randomUUID(),
    participantId,
    participantName: participant.name,
    text: trimmedText,
    submittedAt: now(),
    isCorrect,
    pointsAwarded
  });
  room.scores[participantId] = (room.scores[participantId] ?? 0) + pointsAwarded;

  if (isCorrect && !alreadyCorrect) {
    room.status = "results";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function endRound(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.hostId !== participantId) {
    return { ok: false as const, reason: "host-required" as const };
  }

  if (room.status !== "game") {
    return { ok: false as const, reason: "game-required" as const };
  }

  room.status = "results";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.hostId !== participantId) {
    return { ok: false as const, reason: "host-required" as const };
  }

  if (room.status !== "results") {
    return { ok: false as const, reason: "results-required" as const };
  }

  room.status = "lobby";
  room.drawerId = null;
  room.secretWord = null;
  room.drawing = [];
  room.guesses = [];
  room.scores = initialScores(room.participants);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && room.drawerId !== null && viewerParticipantId === room.drawerId;
  const canSeeSecretWord = room.status === "results" || isDrawer;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: canSeeSecretWord ? room.secretWord : null,
    drawing: structuredClone(room.drawing),
    guesses: structuredClone(room.guesses),
    scores: { ...room.scores }
  };
}
