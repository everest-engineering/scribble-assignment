import { randomUUID } from "node:crypto";
import type { GuessEntry, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
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

function createParticipant(name?: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    isHost,
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    currentDrawerId: null,
    secretWord: null,
    canvasStrokes: [],
    guessHistory: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function startRoom(code: string, requestingParticipantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const host = room.participants.find((p) => p.id === requestingParticipantId && p.isHost);

  if (!host) {
    return { error: "Only the host can start the game" as string };
  }

  const drawerIndex = 0; // host is always index 0
  room.currentDrawerId = room.participants[drawerIndex].id;
  room.secretWord = STARTER_WORDS[0];
  room.status = "active";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function joinRoom(code: string, playerName?: string) {
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

export function updateCanvas(code: string, strokes: Stroke[]) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  room.canvasStrokes = strokes;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, rawGuess: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    return { error: "Participant not found in this room" as string };
  }

  const trimmed = rawGuess.trim();

  if (trimmed.length === 0) {
    return { error: "Guess cannot be empty" as string };
  }

  const correct =
    room.secretWord !== null &&
    trimmed.toLowerCase() === room.secretWord.toLowerCase();

  if (correct) {
    participant.score += 100;
  }

  const entry: GuessEntry = {
    participantId,
    playerName: participant.name,
    guessText: trimmed,
    correct
  };

  room.guessHistory.push(entry);

  // Auto-transition to results when all guessers have guessed correctly
  const guessers = room.participants.filter((p) => p.id !== room.currentDrawerId);
  const correctGuessers = new Set(
    room.guessHistory.filter((g) => g.correct).map((g) => g.participantId)
  );
  if (guessers.length > 0 && guessers.every((p) => correctGuessers.has(p.id))) {
    room.status = "results";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room), correct };
}

export function restartRoom(code: string, requestingParticipantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const host = room.participants.find(
    (p) => p.id === requestingParticipantId && p.isHost
  );

  if (!host) {
    return { error: "Only the host can restart the game" as string };
  }

  // Reset round state, preserve participants
  room.participants.forEach((p) => {
    p.score = 0;
  });
  room.currentDrawerId = null;
  room.secretWord = null;
  room.canvasStrokes = [];
  room.guessHistory = [];
  room.status = "lobby";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId != null && viewerParticipantId === room.currentDrawerId;
  // In results state, everyone sees the secret word
  const showSecret = isDrawer || room.status === "results";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    currentDrawerId: room.currentDrawerId,
    secretWord: showSecret ? room.secretWord : null,
    canvasStrokes: room.canvasStrokes.map((s) => ({ ...s, points: [...s.points] })),
    guessHistory: [...room.guessHistory]
  };
}
