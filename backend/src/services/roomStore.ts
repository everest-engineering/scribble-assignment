import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, GuessLog } from "../models/game.js";
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
    name: displayName(name).trim(),
    joinedAt: now(),
    score: 0,
    hasGuessedCorrectly: false
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

  const nameToCheck = displayName(playerName).trim().toLowerCase();
  const nameExists = room.participants.some(
    (p) => p.name.trim().toLowerCase() === nameToCheck
  );
  if (nameExists) {
    throw new Error("Player name already taken in this room");
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
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startGame(code: string, hostParticipantId: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }
  if (room.hostId !== hostParticipantId) {
    throw new Error("Only the host can start the game");
  }
  if (room.participants.length < 2) {
    throw new Error("Cannot start game: at least 2 players are required");
  }
  room.status = "active";
  room.drawerId = room.hostId;
  if (room.previousWord) {
    const available = STARTER_WORDS.filter((w) => w !== room.previousWord);
    room.currentWord = available[Math.floor(Math.random() * available.length)];
  } else {
    room.currentWord = STARTER_WORDS[0];
  }
  
  // Set roles on participants
  room.participants.forEach((p) => {
    p.role = p.id === room.drawerId ? "drawer" : "guesser";
  });

  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const participants = room.participants.map((p) => {
    const role = (room.status === "active" || room.status === "results") ? (p.id === room.drawerId ? "drawer" as const : "guesser" as const) : undefined;
    return { ...p, role };
  });

  let wordTemplate: string | undefined;
  if (room.status === "active" && room.currentWord) {
    if (viewerParticipantId === room.drawerId) {
      wordTemplate = room.currentWord;
    } else {
      wordTemplate = room.currentWord.split("").map((c) => (c === " " ? " " : "_")).join("");
    }
  } else if (room.status === "results" && room.currentWord) {
    wordTemplate = room.currentWord;
  }

  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants,
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    drawerId: room.drawerId,
    wordTemplate,
    previousWord: room.previousWord,
    drawingData: room.drawingData,
    guesses: room.guesses || []
  };
}

export function updateCanvas(code: string, drawerId: string, drawingData: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }
  if (room.status !== "active") {
    throw new Error("Cannot draw: game is not active");
  }
  if (room.drawerId !== drawerId) {
    throw new Error("Only the active drawer can draw on the canvas");
  }
  room.drawingData = drawingData;
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }
  if (room.status !== "active") {
    throw new Error("Cannot submit guess: game is not active");
  }

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new Error("Participant not found in room");
  }

  if (room.drawerId === participantId) {
    throw new Error("Drawer cannot submit guesses");
  }

  const trimmedGuess = guessText.trim();
  if (!trimmedGuess) {
    throw new Error("Guess cannot be empty");
  }

  const isCorrect = trimmedGuess.toLowerCase() === room.currentWord?.toLowerCase();
  
  if (isCorrect && !participant.hasGuessedCorrectly) {
    participant.score += 100;
    participant.hasGuessedCorrectly = true;
  }

  const guessLog: GuessLog = {
    id: randomUUID(),
    playerName: participant.name,
    text: trimmedGuess,
    isCorrect,
    timestamp: now()
  };

  room.guesses.push(guessLog);

  // Check if all guessers have guessed correctly
  const guessers = room.participants.filter((p) => p.id !== room.drawerId);
  const allCorrect = guessers.length > 0 && guessers.every((g) => g.hasGuessedCorrectly);
  if (allCorrect) {
    room.status = "results";
  }

  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function endRound(code: string, hostParticipantId: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }
  if (room.hostId !== hostParticipantId) {
    throw new Error("Only the host can end the round");
  }
  room.status = "results";
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}

export function restartGame(code: string, hostParticipantId: string) {
  const room = rooms.get(code);
  if (!room) {
    return null;
  }
  if (room.hostId !== hostParticipantId) {
    throw new Error("Only the host can restart the game");
  }
  room.status = "lobby";
  room.drawerId = undefined;
  room.previousWord = room.currentWord;
  room.currentWord = undefined;
  room.drawingData = undefined;
  room.guesses = [];
  room.participants.forEach((p) => {
    p.score = 0;
    p.hasGuessedCorrectly = false;
    p.role = undefined;
  });
  room.updatedAt = now();
  rooms.set(room.code, room);
  return cloneRoom(room);
}
