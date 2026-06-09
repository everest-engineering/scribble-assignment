import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, RoundState, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { pickWords } from "./wordBank.js";

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
    participants: [participant],
    hostId: participant.id,
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

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    throw new Error("Game already in progress");
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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("Need at least 2 players to start");
  }

  if (room.status !== "lobby") {
    throw new Error("Game has already started");
  }

  const drawerIndex = Math.floor(Math.random() * room.participants.length);
  const drawerId = room.participants[drawerIndex].id;
  const guesserIds = room.participants
    .filter((p) => p.id !== drawerId)
    .map((p) => p.id);

  const wordOptions = pickWords(3);

  room.status = "in-progress";
  room.round = {
    drawerId,
    guesserIds,
    wordOptions,
    secretWord: null,
    phase: "word-selection",
    strokes: [],
    guesses: []
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function selectWord(code: string, participantId: string, word: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (!room.round) {
    throw new Error("Game has not started yet");
  }

  if (room.round.drawerId !== participantId) {
    throw new Error("Only the drawer can select a word");
  }

  if (room.round.phase !== "word-selection") {
    throw new Error("Word already selected");
  }

  if (!room.round.wordOptions.includes(word)) {
    throw new Error("Invalid word selection");
  }

  room.round.secretWord = word;
  room.round.phase = "drawing";
  room.round.wordOptions = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (!room.round) {
    throw new Error("Game has not started yet");
  }

  if (room.round.drawerId === participantId) {
    throw new Error("The drawer cannot submit guesses");
  }

  if (room.round.phase === "finished") {
    throw new Error("The round has ended");
  }

  if (room.round.phase !== "drawing") {
    throw new Error("Game is not in the drawing phase");
  }

  if (room.round.guesses.some((g) => g.participantId === participantId && g.isCorrect)) {
    throw new Error("You have already guessed correctly");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  const guessText = text.trim();
  const isCorrect = guessText.toLowerCase() === (room.round.secretWord ?? "").toLowerCase();

  room.round.guesses.push({
    participantId,
    participantName: participant?.name ?? "Unknown",
    text: guessText,
    isCorrect,
    guessedAt: now()
  });

  if (isCorrect) {
    room.round.phase = "finished";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { correct: isCorrect };
}

export function addStroke(code: string, participantId: string, strokes: Stroke[]) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (!room.round) {
    throw new Error("Game has not started yet");
  }

  if (room.round.drawerId !== participantId) {
    throw new Error("Only the drawer can submit strokes");
  }

  if (room.round.phase === "finished") {
    throw new Error("The round has ended");
  }

  if (room.round.phase !== "drawing") {
    throw new Error("Round is not in drawing phase");
  }

  room.round.strokes.push(...strokes);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearStrokes(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (!room.round) {
    throw new Error("Game has not started yet");
  }

  if (room.round.drawerId !== participantId) {
    throw new Error("Only the drawer can clear strokes");
  }

  if (room.round.phase !== "drawing") {
    throw new Error("Round is not in drawing phase");
  }

  room.round.strokes = [];
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can restart the game");
  }

  if (room.round?.phase !== "finished") {
    throw new Error("Round is not finished yet");
  }

  room.status = "lobby";
  room.round = null;
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = room.round !== null && viewerParticipantId === room.round.drawerId;
  const isFinished = room.round?.phase === "finished";

  const guesses = room.round
    ? room.round.guesses.map((g) => ({
        ...g,
        isCorrect:
          isFinished || viewerParticipantId === g.participantId ? g.isCorrect : null
      }))
    : [];

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: room.round?.drawerId ?? null,
    phase: room.round?.phase ?? null,
    wordOptions: isDrawer ? room.round!.wordOptions : null,
    secretWord: isDrawer || isFinished ? room.round!.secretWord : null,
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    strokes: room.round?.strokes ?? [],
    guesses
  };
}
