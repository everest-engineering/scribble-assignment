import { randomUUID } from "node:crypto";
import type {
  CanvasEvent,
  CanvasStroke,
  GuessEntry,
  Participant,
  Room,
  RoomSnapshot
} from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { normalizeGuessText } from "../api/schemas.js";

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

function createInitialScores(participants: Participant[]) {
  return participants.reduce<Record<string, number>>((scores, participant) => {
    scores[participant.id] = 0;
    return scores;
  }, {});
}

function createRoundDrawer(participants: Participant[]) {
  return participants[0] ?? null;
}

function createCanvasEvent(participantId: string, stroke: CanvasStroke): CanvasEvent {
  return {
    id: randomUUID(),
    type: "stroke",
    participantId,
    createdAt: now(),
    stroke
  };
}

function createGuessEntry(
  participantId: string,
  rawText: string,
  normalizedText: string,
  isCorrect: boolean
): GuessEntry {
  return {
    id: randomUUID(),
    participantId,
    rawText,
    normalizedText,
    isCorrect,
    pointsAwarded: isCorrect ? 100 : 0,
    createdAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function resetRooms() {
  rooms.clear();
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    round: null,
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
  if (room.round) {
    room.round.scores[participant.id] = 0;
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

export function startRoom(code: string, participantId: string, secretWord: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.round) {
    throw new Error("Round is already in progress");
  }

  if (!STARTER_WORDS.includes(secretWord as (typeof STARTER_WORDS)[number])) {
    throw new Error("Secret word must come from the starter list");
  }

  const host = createRoundDrawer(room.participants);

  if (!host || host.id !== participantId) {
    throw new Error("Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("At least 2 players are required to start");
  }

  room.status = "game";
  room.round = {
    drawerParticipantId: host.id,
    secretWord,
    phase: "active",
    startedAt: now(),
    endedAt: null,
    canvasEvents: [],
    guessHistory: [],
    scores: createInitialScores(room.participants)
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

function assertRoomRound(room: Room) {
  if (!room.round) {
    throw new Error("No active round");
  }

  return room.round;
}

function assertActiveRound(room: Room) {
  const round = assertRoomRound(room);

  if (round.phase === "ended") {
    throw new Error("Round has ended");
  }

  return round;
}

function assertEndedRound(room: Room) {
  const round = assertRoomRound(room);

  if (round.phase !== "ended") {
    throw new Error("Round has not ended");
  }

  return round;
}

function assertDrawer(room: Room, participantId: string) {
  const round = assertActiveRound(room);

  if (round.drawerParticipantId !== participantId) {
    throw new Error("Only the drawer can perform this action");
  }

  return round;
}

function assertGuesser(room: Room, participantId: string) {
  const round = assertActiveRound(room);

  if (round.drawerParticipantId === participantId) {
    throw new Error("The drawer cannot submit guesses");
  }

  const participantExists = room.participants.some((participant) => participant.id === participantId);

  if (!participantExists) {
    throw new Error("Participant is not in the room");
  }

  return round;
}

export function drawCanvas(
  code: string,
  participantId: string,
  stroke: CanvasStroke
) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const round = assertDrawer(room, participantId);
  round.canvasEvents.push(createCanvasEvent(participantId, stroke));
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearCanvas(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const round = assertDrawer(room, participantId);
  round.canvasEvents = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const round = assertGuesser(room, participantId);
  const trimmedGuess = guessText.trim();

  if (trimmedGuess.length === 0) {
    throw new Error("Guess text is required");
  }

  const normalizedGuess = normalizeGuessText(trimmedGuess);
  const isCorrect = normalizedGuess === round.secretWord.toLowerCase();
  const guess = createGuessEntry(participantId, trimmedGuess, normalizedGuess, isCorrect);

  round.guessHistory.push(guess);
  round.scores[participantId] = (round.scores[participantId] ?? 0) + guess.pointsAwarded;

  if (guess.isCorrect) {
    round.phase = "ended";
    round.endedAt = now();
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  assertEndedRound(room);
  const host = createRoundDrawer(room.participants);

  if (!host || host.id !== participantId) {
    throw new Error("Only the host can restart the game");
  }

  room.status = "lobby";
  room.round = null;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const drawerParticipantId = room.round?.drawerParticipantId ?? null;
  const round = room.round;
  const isDrawer = drawerParticipantId !== null && drawerParticipantId === viewerParticipantId;
  const isEnded = round?.phase === "ended";

  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    drawerParticipantId,
    roundPhase: round?.phase ?? null,
    canvasEvents: round ? round.canvasEvents.map((event) => structuredClone(event)) : [],
    guessHistory: round ? round.guessHistory.map((entry) => ({ ...entry })) : [],
    scores: round ? { ...round.scores } : {}
  };

  if (round && (isDrawer || isEnded)) {
    snapshot.secretWord = round.secretWord;
  }

  return snapshot;
}
