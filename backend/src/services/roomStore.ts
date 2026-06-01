import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function selectWord(code: string, participants: Participant[]): string {
  const sortedIds = [...participants].map((p) => p.id).sort().join(",");
  const hash = Math.abs(hashCode(code + sortedIds));
  const words = [...STARTER_WORDS];
  return words[hash % words.length];
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName ?? "Player");
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    drawerId: null,
    secretWord: null,
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    strokes: [],
    clearVersion: 0,
    guesses: [],
    scores: new Map()
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

  const trimmed = (playerName ?? "").trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > 20) {
    return null;
  }

  const isDuplicate = room.participants.some((p) => p.name === trimmed);

  if (isDuplicate) {
    return null;
  }

  const participant = createParticipant(trimmed);
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

export function leaveRoom(code: string, participantId: string):
  | { ok: true; room: Room | null }
  | { ok: false; error: string; status: number } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found", status: 404 };
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return { ok: false, error: "Participant not found", status: 404 };
  }

  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    rooms.delete(code);
    return { ok: true, room: null };
  }

  const sorted = [...room.participants].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );

  if (room.hostId === participantId) {
    room.hostId = sorted[0].id;
  }

  const drawerChanged = room.drawerId === participantId;

  if (drawerChanged) {
    room.drawerId = sorted[0].id;
  }

  if (drawerChanged && room.status === "playing") {
    room.secretWord = selectWord(room.code, room.participants);
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}

function allGuessersCorrect(room: Room): boolean {
  const guessers = room.participants.filter((p) => p.id !== room.drawerId);
  if (guessers.length === 0) return false;
  return guessers.every((g) => room.guesses.some((g2) => g2.participantId === g.id && g2.isCorrect));
}

function buildScores(room: Room): { participantId: string; name: string; score: number }[] {
  const scoreMap = new Map<string, number>();
  for (const g of room.guesses) {
    if (g.isCorrect) {
      scoreMap.set(g.participantId, 1);
    }
  }
  return room.participants
    .map((p) => ({
      participantId: p.id,
      name: p.name,
      score: scoreMap.get(p.id) ?? 0
    }))
    .sort((a, b) => b.score - a.score);
}

export function submitStrokes(code: string, participantId: string, strokes: import("../models/game.js").DrawingStroke[]):
  { ok: true; room: Room } | { ok: false; error: string; status: number } {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "Room not found", status: 404 };
  if (room.status !== "playing") return { ok: false, error: "Game is not in progress", status: 400 };
  if (room.drawerId !== participantId) return { ok: false, error: "Only the drawer can draw", status: 403 };

  room.strokes.push(...strokes);
  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true, room: cloneRoom(room) };
}

export function clearCanvas(code: string, participantId: string):
  { ok: true; room: Room } | { ok: false; error: string; status: number } {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "Room not found", status: 404 };
  if (room.status !== "playing") return { ok: false, error: "Game is not in progress", status: 400 };
  if (room.drawerId !== participantId) return { ok: false, error: "Only the drawer can clear the canvas", status: 403 };

  room.strokes = [];
  room.clearVersion += 1;
  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true, room: cloneRoom(room) };
}

export function getStrokes(code: string):
  { ok: true; strokes: import("../models/game.js").DrawingStroke[]; clearVersion: number } | { ok: false; error: string; status: number } {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "Room not found", status: 404 };
  return { ok: true, strokes: room.strokes, clearVersion: room.clearVersion };
}

export function submitGuess(code: string, participantId: string, text: string):
  { ok: true; isCorrect: boolean; allGuessersCorrect: boolean; room: Room } | { ok: false; error: string; status: number } {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "Room not found", status: 404 };
  if (room.status !== "playing") return { ok: false, error: "Game is not in progress", status: 400 };
  if (room.drawerId === participantId) return { ok: false, error: "Drawer cannot guess", status: 403 };

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Guess cannot be empty", status: 400 };
  if (trimmed.length > 200) return { ok: false, error: "Guess too long", status: 400 };

  const alreadyCorrect = room.guesses.some((g) => g.participantId === participantId && g.isCorrect);
  if (alreadyCorrect) {
    return { ok: true, isCorrect: true, allGuessersCorrect: allGuessersCorrect(room), room: cloneRoom(room) };
  }

  const isCorrect = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();

  room.guesses.push({
    participantId,
    text: trimmed,
    isCorrect,
    timestamp: now()
  });

  if (isCorrect) {
    room.scores.set(participantId, 1);
  }

  const allCorrect = allGuessersCorrect(room);
  if (allCorrect) {
    room.status = "round_ended";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true, isCorrect, allGuessersCorrect: allCorrect, room: cloneRoom(room) };
}

export function revealWord(code: string, participantId: string):
  { ok: true; room: Room } | { ok: false; error: string; status: number } {
  const room = rooms.get(code);
  if (!room) return { ok: false, error: "Room not found", status: 404 };
  if (room.status !== "playing") return { ok: false, error: "Game is not in progress", status: 400 };
  if (room.drawerId !== participantId) return { ok: false, error: "Only the drawer can reveal the word", status: 403 };

  room.status = "round_ended";
  room.updatedAt = now();
  rooms.set(room.code, room);
  return { ok: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;
  const showSecretWord = isDrawer && room.secretWord ? true : room.status === "round_ended" && room.secretWord ? true : false;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    secretWord: showSecretWord ? room.secretWord! : undefined,
    yourRole: isDrawer ? "drawer" : "guesser",
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    strokes: room.strokes,
    clearVersion: room.clearVersion,
    guesses: room.guesses,
    scores: buildScores(room),
    allGuessersCorrect: allGuessersCorrect(room)
  };
}

export function startGame(code: string, participantId: string):
  | { ok: true; room: Room }
  | { ok: false; error: string; status: number } {
  const room = rooms.get(code);

  if (!room) {
    return { ok: false, error: "Room not found", status: 404 };
  }

  if (room.hostId !== participantId) {
    return { ok: false, error: "Only the host can start the game", status: 403 };
  }

  if (room.participants.length < 2) {
    return { ok: false, error: "At least 2 players are required to start", status: 400 };
  }

  const sorted = [...room.participants].sort(
    (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
  );
  room.drawerId = sorted[0].id;
  room.secretWord = selectWord(room.code, room.participants);
  room.status = "playing";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true, room: cloneRoom(room) };
}
