import { randomUUID } from "node:crypto";
import type { DrawingData, Participant, Room, RoomSnapshot, RoundState } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();
const emptyDrawing: DrawingData = { paths: [] };

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

function cloneRoom(room: Room) {
  return structuredClone(room);
}

function cloneDrawing(drawing: DrawingData) {
  return structuredClone(drawing);
}

function findParticipant(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId) ?? null;
}

function scoreEntries(room: Room) {
  const scores = room.round?.scores ?? {};
  return room.participants.map((participant) => ({
    participantId: participant.id,
    playerName: participant.name,
    score: scores[participant.id] ?? 0
  }));
}

function selectWinner(room: Room) {
  return scoreEntries(room).reduce((winner, entry) => (entry.score > winner.score ? entry : winner));
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const createdAt = now();
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    round: null,
    createdAt,
    updatedAt: createdAt
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code.toUpperCase());

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

export function getRoom(code: string) {
  const room = rooms.get(code.toUpperCase());
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function clearRoomsForTest() {
  rooms.clear();
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.hostId !== participantId) {
    return { ok: false as const, reason: "not-host" as const };
  }

  if (room.participants.length < 2) {
    return { ok: false as const, reason: "not-enough-players" as const };
  }

  const drawer = room.participants[0];
  const secretWord = STARTER_WORDS[0] ?? "house";
  const scores = Object.fromEntries(room.participants.map((participant) => [participant.id, 0]));
  const round: RoundState = {
    drawerId: drawer.id,
    secretWord,
    drawing: cloneDrawing(emptyDrawing),
    guesses: [],
    scores,
    result: null
  };

  room.status = "playing";
  room.round = round;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function updateDrawing(code: string, participantId: string, drawing: DrawingData) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.status !== "playing" || !room.round) {
    return { ok: false as const, reason: "not-playing" as const };
  }

  if (room.round.drawerId !== participantId) {
    return { ok: false as const, reason: "not-drawer" as const };
  }

  room.round.drawing = cloneDrawing(drawing);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function clearDrawing(code: string, participantId: string) {
  return updateDrawing(code, participantId, emptyDrawing);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.status !== "playing" || !room.round) {
    return { ok: false as const, reason: "not-playing" as const };
  }

  if (room.round.drawerId === participantId) {
    return { ok: false as const, reason: "drawer-cannot-guess" as const };
  }

  const participant = findParticipant(room, participantId);
  if (!participant) {
    return { ok: false as const, reason: "unknown-participant" as const };
  }

  const normalizedGuess = text.trim();
  const isCorrect = normalizedGuess.localeCompare(room.round.secretWord, undefined, { sensitivity: "accent" }) === 0;

  const guess = {
    id: randomUUID(),
    participantId,
    playerName: participant.name,
    text: normalizedGuess,
    isCorrect,
    createdAt: now()
  };

  room.round.guesses.push(guess);

  if (isCorrect) {
    room.round.scores[participantId] = 100;
    const winner = selectWinner(room);
    room.round.result = {
      correctWord: room.round.secretWord,
      winnerId: winner.participantId,
      winnerName: winner.playerName
    };
    room.status = "results";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code.toUpperCase());

  if (!room) {
    return { ok: false as const, reason: "not-found" as const };
  }

  if (room.hostId !== participantId) {
    return { ok: false as const, reason: "not-host" as const };
  }

  if (room.status !== "results") {
    return { ok: false as const, reason: "not-results" as const };
  }

  room.status = "lobby";
  room.round = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { ok: true as const, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isResults = room.status === "results";
  const isDrawer = room.round?.drawerId === viewerParticipantId;
  const showSecretWord = Boolean(room.round && (isDrawer || isResults));

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    drawerId: room.round?.drawerId ?? null,
    secretWord: showSecretWord ? room.round?.secretWord ?? null : null,
    drawing: room.round ? cloneDrawing(room.round.drawing) : cloneDrawing(emptyDrawing),
    guesses: room.round?.guesses.map((guess) => ({ ...guess })) ?? [],
    scores: scoreEntries(room),
    result: room.round?.result ? { ...room.round.result } : null,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
