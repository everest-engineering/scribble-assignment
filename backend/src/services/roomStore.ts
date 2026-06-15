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
  return name?.trim() || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    score: 0,
    joinedAt: now()
  };
}

function chooseSecretWord(code: string) {
  const hash = [...code].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const index = hash % STARTER_WORDS.length;
  return STARTER_WORDS[index];
}

function normalizeGuess(guessText: string) {
  return guessText.trim();
}

function createGuess(participant: Participant, text: string) {
  const normalizedText = normalizeGuess(text);

  return {
    id: randomUUID(),
    participantId: participant.id,
    participantName: participant.name,
    text: normalizedText,
    isCorrect: false,
    createdAt: now()
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
    guesses: [],
    canvasCleared: false,
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

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    throw new Error("Room is not in lobby state");
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new Error("At least two players are required to start the game");
  }

  const secretWord = chooseSecretWord(room.code);

  room.status = "active";
  room.activeRound = {
    drawerId: room.hostId,
    secretWord,
    isFinished: false
  };
  room.guesses = [];
  room.canvasCleared = false;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "active" || !room.activeRound || room.activeRound.isFinished) {
    throw new Error("Game is not active");
  }

  if (room.activeRound.drawerId === participantId) {
    throw new Error("Drawer cannot submit guesses");
  }

  const participant = room.participants.find((item) => item.id === participantId);

  if (!participant) {
    return null;
  }

  const normalizedGuess = normalizeGuess(guessText);

  if (!normalizedGuess) {
    throw new Error("Guess is required");
  }

  const guess = createGuess(participant, normalizedGuess);
  const isCorrect = guess.text.toLowerCase() === room.activeRound.secretWord.toLowerCase();
  guess.isCorrect = isCorrect;

  room.guesses.push(guess);

  if (isCorrect) {
    participant.score += 100;
    room.activeRound.isFinished = true;
    room.activeRound.finishedAt = now();
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearCanvas(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "active" || !room.activeRound || room.activeRound.isFinished) {
    throw new Error("Game is not active");
  }

  if (room.activeRound.drawerId !== participantId) {
    throw new Error("Only the drawer can clear the canvas");
  }

  room.canvasCleared = true;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "active" || !room.activeRound || !room.activeRound.isFinished) {
    throw new Error("Round is not finished");
  }

  if (room.hostId !== participantId) {
    throw new Error("Only the host can restart the game");
  }

  room.status = "lobby";
  room.activeRound = undefined;
  room.guesses = [];
  room.canvasCleared = false;
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
  const activeRound = room.activeRound;
  const isViewerDrawer = activeRound?.drawerId === viewerParticipantId;
  const roundFinished = activeRound?.isFinished === true;

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    drawerId: activeRound?.drawerId,
    viewerRole: activeRound ? (isViewerDrawer ? "drawer" : "guesser") : undefined,
    secretWord:
      activeRound && (isViewerDrawer || roundFinished) ? activeRound.secretWord : undefined,
    guesses: [...room.guesses],
    canvasCleared: room.canvasCleared,
    canRestartGame: roundFinished
  };
}
