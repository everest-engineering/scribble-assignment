import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function normalizePlayerName(name?: string) {
  return name?.trim() ?? "";
}

function displayName(name?: string) {
  const normalizedName = normalizePlayerName(name);
  return normalizedName || "Player";
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
    guessHistory: [],
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
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

function pickDeterministicWord(code: string) {
  const index = code
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0) % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

export function startGame(code: string) {
  const room = rooms.get(code);

  if (!room || room.status !== "lobby" || room.participants.length < 2) {
    return null;
  }

  const drawerId = room.hostId;
  const secretWord = pickDeterministicWord(code);
  
  room.status = "playing";
  room.drawerId = drawerId;
  room.secretWord = secretWord;
  
  // Initialize scores for all participants
  room.scores = {};
  for (const participant of room.participants) {
    room.scores[participant.id] = 0;
  }
  
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
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

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);

  if (!room || room.status !== "playing") {
    return { success: false, error: "Room is not playing" };
  }

  const trimmedGuess = guessText.trim();
  if (!trimmedGuess) {
    return { success: false, error: "Guess cannot be empty" };
  }

  const normalizedGuess = trimmedGuess.toLowerCase();
  const secretWordNormalized = (room.secretWord ?? "").toLowerCase();
  const correct = normalizedGuess === secretWordNormalized;

  const guess: Guess = {
    id: randomUUID(),
    participantId,
    playerName: room.participants.find((p) => p.id === participantId)?.name ?? "Unknown",
    text: trimmedGuess,
    normalizedText: normalizedGuess,
    correct,
    timestamp: now(),
    scoreImpact: correct ? 100 : 0
  };

  room.guessHistory.push(guess);

  if (correct && room.scores[participantId] !== undefined) {
    room.scores[participantId] += 100;
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return { success: true, guess };
}

export function updateCanvasState(code: string, canvasState: string): { success: boolean; error?: string } {
  const room = rooms.get(code);

  if (!room) {
    return {
      success: false,
      error: "Room not found"
    };
  }

  if (room.status !== "playing") {
    return {
      success: false,
      error: "Game is not currently active"
    };
  }

  room.canvasState = canvasState;
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return {
    success: true
  };
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { success: false, error: "Room not found", status: 404 };
  }

  if (room.status !== "finished") {
    return { success: false, error: "Room is not in a finished state", status: 409 };
  }

  if (participantId !== room.hostId) {
    return { success: false, error: "Only the host can restart the game", status: 403 };
  }

  room.status = "lobby";
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.canvasState = null;
  room.guessHistory = [];
  room.scores = {};
  room.endedAt = undefined;
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return { success: true, room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isViewerDrawer = Boolean(viewerParticipantId && room.drawerId && viewerParticipantId === room.drawerId);
  const isFinished = room.status === "finished";
  const showSecretWord = isViewerDrawer || isFinished;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    isHost: Boolean(viewerParticipantId && viewerParticipantId === room.hostId),
    isDrawer: isViewerDrawer,
    secretWord: showSecretWord ? room.secretWord : undefined,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    guessHistory: room.guessHistory,
    scores: { ...room.scores },
    endedAt: room.endedAt
  };
}
