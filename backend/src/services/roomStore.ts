import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export class RoomStoreError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
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

function normalisePlayerName(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new RoomStoreError(400, "Player name is required");
  }

  return trimmedName;
}

function createParticipant(name: string, isHost = false): Participant {
  return {
    id: randomUUID(),
    name: normalisePlayerName(name),
    isHost,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

function getParticipant(room: Room, participantId: string) {
  return room.participants.find((participant) => participant.id === participantId) ?? null;
}

function requireParticipant(room: Room, participantId: string) {
  const participant = getParticipant(room, participantId);

  if (!participant) {
    throw new RoomStoreError(403, "Participant is not in this room");
  }

  return participant;
}

function requireHost(room: Room, participantId: string) {
  requireParticipant(room, participantId);

  if (room.hostId !== participantId) {
    throw new RoomStoreError(403, "Only the host can perform this action");
  }
}

function requireActiveRound(room: Room) {
  if (room.status !== "playing" || !room.round) {
    throw new RoomStoreError(409, "Round is not active");
  }

  return room.round;
}

function saveLiveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, true);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    scores: {},
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

  if (room.status !== "lobby") {
    throw new RoomStoreError(409, "Game already started");
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);

  return {
    room: saveLiveRoom(room),
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

  requireHost(room, participantId);

  if (room.status !== "lobby") {
    throw new RoomStoreError(409, "Game has already started");
  }

  if (room.participants.length < 2) {
    throw new RoomStoreError(400, "At least 2 players are required to start");
  }

  const drawer = getParticipant(room, room.hostId) ?? room.participants[0];
  room.status = "playing";
  room.scores = Object.fromEntries(room.participants.map((participant) => [participant.id, 0]));
  room.round = {
    drawerId: drawer.id,
    word: STARTER_WORDS[0],
    drawingDataUrl: null,
    guesses: [],
    startedAt: now(),
    endedAt: null
  };

  return saveLiveRoom(room);
}

export function updateDrawing(code: string, participantId: string, drawingDataUrl: string | null) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  requireParticipant(room, participantId);
  const round = requireActiveRound(room);

  if (round.drawerId !== participantId) {
    throw new RoomStoreError(403, "Only the drawer can update the drawing");
  }

  round.drawingDataUrl = drawingDataUrl;
  return saveLiveRoom(room);
}

export function clearDrawing(code: string, participantId: string) {
  return updateDrawing(code, participantId, null);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = requireParticipant(room, participantId);
  const round = requireActiveRound(room);
  const text = guessText.trim();

  if (!text) {
    throw new RoomStoreError(400, "Guess is required");
  }

  if (round.drawerId === participantId) {
    throw new RoomStoreError(403, "Drawer cannot submit guesses");
  }

  const correct = text.toLowerCase() === round.word.toLowerCase();
  const scoreDelta = correct ? 100 : 0;
  const guess: Guess = {
    id: randomUUID(),
    participantId,
    playerName: participant.name,
    text,
    correct,
    scoreDelta,
    createdAt: now()
  };

  round.guesses.push(guess);
  room.scores[participantId] = (room.scores[participantId] ?? 0) + scoreDelta;

  if (correct) {
    room.status = "result";
    round.endedAt = now();
  }

  return saveLiveRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  requireHost(room, participantId);

  if (room.status !== "result") {
    throw new RoomStoreError(409, "Round must be complete before restarting");
  }

  room.status = "lobby";
  room.scores = {};
  room.round = null;

  return saveLiveRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const round = room.round;
  const drawer = round ? getParticipant(room, round.drawerId) : null;
  const canSeeWord = Boolean(round && (room.status === "result" || viewerParticipantId === round.drawerId));

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    drawerId: round?.drawerId ?? null,
    drawerName: drawer?.name ?? null,
    secretWord: canSeeWord && round ? round.word : null,
    wordLength: round?.word.length ?? null,
    drawingDataUrl: round?.drawingDataUrl ?? null,
    guesses: round?.guesses.map((guess) => ({ ...guess })) ?? [],
    scores: room.participants.map((participant) => ({
      participantId: participant.id,
      playerName: participant.name,
      score: room.scores[participant.id] ?? 0
    })),
    result:
      room.status === "result" && round
        ? {
            word: round.word,
            endedAt: round.endedAt ?? room.updatedAt
          }
        : null
  };
}

export function resetRoomsForTests() {
  rooms.clear();
}
