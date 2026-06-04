import { randomUUID } from "node:crypto";
import type {
  DrawingPoint,
  Participant,
  ParticipantScore,
  Room,
  RoomSnapshot
} from "../models/game.js";
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

  const scores: ParticipantScore[] = [
    {
      participantId: participant.id,
      score: 0
    }
  ];

  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    drawerId: participant.id,
    secretWord: STARTER_WORDS[0],
    drawing: [],
    guesses: [],
    scores,
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

  room.scores.push({
    participantId: participant.id,
    score: 0
  });

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

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.hostId !== participantId) {
    return null;
  }

  if (room.participants.length < 2) {
    return null;
  }

  room.status = "playing";
  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(
  code: string,
  participantId: string,
  guess: string
) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  const participant = room.participants.find(
    (player) => player.id === participantId
  );

  if (!participant) {
    return null;
  }

  const normalizedGuess = guess.trim();

  const isCorrect =
    normalizedGuess.toLowerCase() ===
    (room.secretWord ?? "").toLowerCase();

  room.guesses.push({
    participantId,
    participantName: participant.name,
    guess: normalizedGuess,
    isCorrect,
    createdAt: now()
  });

  if (isCorrect) {
    const score = room.scores.find(
      (entry) => entry.participantId === participantId
    );

    if (score) {
      score.score += 100;
    }

    room.status = "finished";
  }

  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function saveDrawing(
  code: string,
  participantId: string,
  points: DrawingPoint[]
) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.drawerId !== participantId) {
    return null;
  }

  room.drawing.push(...points);
  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function clearDrawing(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.drawerId !== participantId) {
    return null;
  }

  room.drawing = [];
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
    return null;
  }

  room.status = "lobby";
  room.drawing = [];
  room.guesses = [];
  room.scores = room.participants.map((p) => ({
    participantId: p.id,
    score: 0
  }));
  room.updatedAt = now();

  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(
  room: Room,
  viewerParticipantId?: string
): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,

    participants: room.participants.map((participant) => ({
      ...participant
    })),

    hostId: room.hostId,
    drawerId: room.drawerId,

    availableWords: listWords(),
    roles: [...STARTER_ROLES],

    secretWord:
      viewerParticipantId === room.drawerId
        ? room.secretWord
        : undefined,

    drawing: [...room.drawing],

    guesses: room.guesses.map((guess) => ({
      ...guess
    })),

    scores: room.scores.map((score) => ({
      ...score
    }))
  };
}