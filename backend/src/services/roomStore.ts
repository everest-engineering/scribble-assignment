import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot, ParticipantRole } from "../models/game.js";
import { STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
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
    throw new Error("Room not found");
  }

  if (room.participants.length >= 20) {
    throw new Error("Room is full");
  }

  const newName = displayName(playerName);
  if (room.participants.some(p => p.name === newName)) {
    throw new Error("Username already taken in this room");
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

// Idle Room Cleanup (every 1 minute)
setInterval(() => {
    const timeNow = Date.now();
    const FIVE_MINUTES = 5 * 60 * 1000;
    for (const [code, room] of rooms.entries()) {
        const lastActivity = new Date(room.updatedAt).getTime();
        if (timeNow - lastActivity > FIVE_MINUTES) {
            rooms.delete(code);
        }
    }
}, 60 * 1000);

export function getRoom(code: string) {
  const room = rooms.get(code);
  if (room && room.currentRound && room.currentRound.roundStatus === "Drawing" && room.currentRound.roundEndTime) {
    if (Date.now() > room.currentRound.roundEndTime) {
      room.currentRound.roundStatus = "Ended";
    }
  }
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  let currentRound = room.currentRound ? { ...room.currentRound } : undefined;
  
  if (currentRound && currentRound.drawerId !== viewerParticipantId) {
    delete currentRound.wordOptions;
    if (currentRound.roundStatus !== "Ended") {
      delete currentRound.secretWord;
    }
  }

  const roles: ParticipantRole[] = room.participants.map(p => {
    if (currentRound && currentRound.drawerId === p.id) return "drawer";
    if (p.id === room.participants[0].id) return "host";
    return "guesser";
  });

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    currentRound,
    availableWords: listWords(),
    roles
  };
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) throw new Error("Room not found");
  if (room.participants.length < 2) throw new Error("Minimum 2 players required to start");
  if (room.participants[0].id !== participantId) throw new Error("Only the host can start the game");

  const drawerIndex = Math.floor(Math.random() * room.participants.length);
  const drawerId = room.participants[drawerIndex].id;

  const allWords = listWords();
  const wordOptions: string[] = [];
  while (wordOptions.length < 3 && allWords.length > 0) {
    const idx = Math.floor(Math.random() * allWords.length);
    wordOptions.push(allWords.splice(idx, 1)[0]);
  }

  room.status = "game";
  room.currentRound = {
    drawerId,
    wordOptions,
    roundStatus: "SelectingWord",
    roundEndTime: null
  };

  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}

export function selectWord(code: string, participantId: string, word: string) {
  const room = rooms.get(code);
  if (!room || room.status !== "game" || !room.currentRound) throw new Error("Invalid room state");
  if (room.currentRound.drawerId !== participantId) throw new Error("Only the drawer can select a word");
  if (room.currentRound.roundStatus !== "SelectingWord") throw new Error("Word already selected");
  if (!room.currentRound.wordOptions?.includes(word)) throw new Error("Invalid word selection");

  room.currentRound.secretWord = word;
  room.currentRound.roundStatus = "Drawing";
  room.currentRound.roundEndTime = Date.now() + 60000; // 60 seconds

  room.updatedAt = now();
  rooms.set(code, room);
  return { participantId, room: cloneRoom(room) };
}
