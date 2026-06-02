import { randomUUID } from "node:crypto";
import type { DrawingStroke, GuessEntry, Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { HttpError } from "../api/schemas.js";

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

function createParticipant(name: string, isHost: boolean): Participant {
  return {
    id: randomUUID(),
    name,
    isHost,
    score: 0,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName, true);
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

  const participant = createParticipant(playerName, false);
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

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new HttpError(403, "You are not in this room");
  }

  if (!participant.isHost) {
    throw new HttpError(403, "Only the host can start the game");
  }

  if (room.participants.length < 2) {
    throw new HttpError(400, "Need at least 2 players to start");
  }

  if (room.status !== "lobby") {
    throw new HttpError(400, "Game has already started");
  }

  const host = room.participants.find((p) => p.isHost)!;

  room.status = "playing";
  room.participants.forEach((p) => {
    p.score = 0;
  });

  room.round = {
    phase: "playing",
    drawerPlayerId: host.id,
    secretWord: STARTER_WORDS[0],
    drawing: [],
    guesses: [],
    winnerPlayerId: null
  };

  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
  };
}

function assertRoomInPhase(
  room: Room | undefined,
  code: string,
  expectedPhase: Room["status"]
): asserts room is Room {
  if (!room) {
    throw new HttpError(404, "Room not found");
  }
  if (room.status !== expectedPhase) {
    throw new HttpError(400, "Room is not in the correct phase");
  }
}

function assertParticipantInRoom(
  room: Room,
  participantId: string
): Participant {
  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) {
    throw new HttpError(403, "You are not in this room");
  }
  return participant;
}

function assertIsDrawer(
  room: Room,
  participantId: string
): void {
  if (room.round?.drawerPlayerId !== participantId) {
    throw new HttpError(403, "Only the drawer can perform this action");
  }
}

export function updateDrawing(code: string, participantId: string, strokes: DrawingStroke[]) {
  const room = rooms.get(code);
  assertRoomInPhase(room, code, "playing");
  assertParticipantInRoom(room, participantId);
  assertIsDrawer(room, participantId);

  room.round!.drawing = strokes;
  room.updatedAt = now();
  rooms.set(code, room);

  return { room: cloneRoom(room) };
}

export function clearDrawing(code: string, participantId: string) {
  const room = rooms.get(code);
  assertRoomInPhase(room, code, "playing");
  assertParticipantInRoom(room, participantId);
  assertIsDrawer(room, participantId);

  room.round!.drawing = [];
  room.updatedAt = now();
  rooms.set(code, room);

  return { room: cloneRoom(room) };
}

export function submitGuess(code: string, participantId: string, value: string) {
  const room = rooms.get(code);
  assertRoomInPhase(room, code, "playing");
  const participant = assertParticipantInRoom(room, participantId);

  if (room.round!.drawerPlayerId === participantId) {
    throw new HttpError(403, "The drawer cannot submit guesses");
  }

  if (room.round!.winnerPlayerId) {
    throw new HttpError(400, "Round has already ended");
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpError(400, "Guess is required");
  }

  const normalized = trimmed.toLowerCase();
  const secretNormalized = room.round!.secretWord!.trim().toLowerCase();
  const isCorrect = normalized === secretNormalized;

  const guessEntry: GuessEntry = {
    id: randomUUID(),
    playerId: participantId,
    playerName: participant.name,
    value: value.trim(),
    normalizedValue: normalized,
    isCorrect,
    createdAt: Date.now()
  };

  room.round!.guesses.push(guessEntry);

  if (isCorrect) {
    participant.score += 100;
    room.round!.winnerPlayerId = participantId;
    room.status = "result";
    room.round!.phase = "result";
  }

  room.updatedAt = now();
  rooms.set(code, room);

  return { room: cloneRoom(room) };
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    throw new HttpError(403, "You are not in this room");
  }

  if (!participant.isHost) {
    throw new HttpError(403, "Only the host can restart the room");
  }

  if (room.status !== "result") {
    throw new HttpError(400, "Room is not in result state");
  }

  room.status = "lobby";
  room.round = null;
  room.updatedAt = now();
  rooms.set(code, room);

  return { room: cloneRoom(room) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const round = room.round
    ? {
        ...room.round,
        secretWord:
          room.status === "result"
            ? room.round.secretWord
            : viewerParticipantId && room.round.drawerPlayerId === viewerParticipantId
              ? room.round.secretWord
              : null
      }
    : null;

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    round,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
