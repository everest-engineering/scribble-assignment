import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { getWordForRoom } from "./wordService.js";

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

function createParticipant(name: string): Participant {
  return {
    id: randomUUID(),
    name: name.trim(),
    joinedAt: now(),
    lastActiveAt: Date.now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    createdAt: now(),
    updatedAt: now(),
    guesses: [],
    drawingState: []
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

  if (room.participants.length >= 12) {
    throw new Error("Room is full");
  }

  const nameTrimmed = playerName.trim();
  if (room.participants.some(p => p.name.toLowerCase() === nameTrimmed.toLowerCase())) {
    throw new Error("Name is already taken");
  }

  const participant = createParticipant(nameTrimmed);
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

export function recordParticipantActivity(code: string, participantId: string) {
  const room = rooms.get(code);
  if (room) {
    const participant = room.participants.find(p => p.id === participantId);
    if (participant) {
      participant.lastActiveAt = Date.now();
    }
  }
}

export function startGame(code: string, hostId: string) {
  const room = rooms.get(code);
  
  if (!room) {
    throw new Error("Room not found");
  }
  
  if (room.participants.length < 2) {
    throw new Error("Cannot start game with fewer than 2 players");
  }
  
  if (room.participants[0]?.id !== hostId) {
    throw new Error("Only the host can start the game");
  }
  
  if (room.status !== "lobby") {
    throw new Error("Game has already started");
  }
  
  room.status = "playing";
  room.roundNumber = 1;
  
  const host = room.participants[0];
  if (host) {
    host.isDrawer = true;
    room.drawerId = host.id;
  }
  
  const word = getWordForRoom(room.code, room.roundNumber);
  room.secretWord = word;
  room.wordLength = word.length;

  room.updatedAt = now();
  rooms.set(code, room);
  
  return cloneRoom(room);
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function endRound(code: string) {
  const room = rooms.get(code);
  if (!room) return null;
  if (room.status !== "playing") return null;
  
  room.status = "result";
  room.updatedAt = now();
  rooms.set(code, room);
  return cloneRoom(room);
}

export function restartGame(code: string, hostId: string) {
  const room = rooms.get(code);
  
  if (!room) {
    throw new Error("Room not found");
  }
  
  if (room.participants[0]?.id !== hostId) {
    throw new Error("Only the host can restart the game");
  }

  room.status = "lobby";
  room.secretWord = undefined;
  room.wordLength = undefined;
  room.drawerId = undefined;
  room.roundNumber = undefined;
  room.guesses = [];
  room.drawingState = [];
  
  room.participants.forEach(p => {
    p.score = 0;
    p.isDrawer = false;
  });

  room.updatedAt = now();
  rooms.set(code, room);
  
  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = room.drawerId && room.drawerId === viewerParticipantId;
  const showSecretWord = isDrawer || room.status === "result";
  const secretWord = showSecretWord ? room.secretWord : null;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES],
    hostId: room.participants[0]?.id ?? "",
    secretWord,
    wordLength: room.wordLength,
    drawerId: room.drawerId,
    roundNumber: room.roundNumber,
    guesses: room.guesses.map(g => ({...g})),
    drawingState: room.drawingState.map(d => ({...d}))
  };
}

setInterval(() => {
  const cutoff = Date.now() - 10000;
  
  for (const [code, room] of rooms.entries()) {
    const initialCount = room.participants.length;
    room.participants = room.participants.filter(p => (p.lastActiveAt ?? Date.now()) > cutoff);
    
    if (room.participants.length === 0) {
      rooms.delete(code);
    } else if (room.participants.length < initialCount) {
      room.updatedAt = now();
      
      // Drawer timeout logic
      if (room.status === "playing" && room.drawerId) {
        const drawerExists = room.participants.some(p => p.id === room.drawerId);
        if (!drawerExists) {
          room.status = "result"; // End round/game if drawer disconnects
        }
      }
    }
  }
}, 5000);
