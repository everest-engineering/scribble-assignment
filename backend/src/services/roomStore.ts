import { randomUUID } from "node:crypto";
import type { Guess, Participant, Room, RoomSnapshot } from "../models/game.js";
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

function createParticipant(name: string): Participant {
  return { id: randomUUID(), name, joinedAt: now() };
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
    hostId: participant.id,
    guesses: [],
    scores: {},
    participants: [participant],
    createdAt: now(),
    updatedAt: now()
  };
  rooms.set(room.code, room);
  return { room: cloneRoom(room), participantId: participant.id };
}

export function joinRoom(code: string, playerName: string) {
  const room = rooms.get(code);
  if (!room) return null;
  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);
  return { room: cloneRoom(room), participantId: participant.id };
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

  if (!room) throw new HttpError(404, "Unable to load room");
  if (room.hostId !== participantId) throw new HttpError(403, "Only the host can start the game");
  if (room.participants.length < 2) throw new HttpError(403, "Need at least 2 players to start");

  room.status = "playing";
  room.drawerId = room.hostId;
  room.secretWord = STARTER_WORDS[0];
  room.guesses = [];
  room.scores = Object.fromEntries(room.participants.map((p) => [p.id, 0]));
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function submitGuess(code: string, participantId: string, text: string) {
  const room = rooms.get(code);

  if (!room) throw new HttpError(404, "Unable to load room");

  const trimmed = text.trim();
  if (!trimmed) throw new HttpError(400, "Guess cannot be empty");

  const correct = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();
  const guess: Guess = { participantId, text: trimmed, correct, submittedAt: now() };

  room.guesses.push(guess);
  if (room.scores[participantId] === undefined) room.scores[participantId] = 0;
  room.scores[participantId] += correct ? 100 : 0;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function endGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) throw new HttpError(404, "Unable to load room");
  if (room.hostId !== participantId) throw new HttpError(403, "Only the host can end the game");
  if (room.status !== "playing") throw new HttpError(400, "Game is not in playing state");

  room.status = "result";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function restartGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) throw new HttpError(404, "Unable to load room");
  if (room.hostId !== participantId) throw new HttpError(403, "Only the host can restart the game");
  if (room.status !== "result") throw new HttpError(400, "Game is not in result state");

  room.status = "lobby";
  room.guesses = [];
  room.scores = {};
  room.drawerId = undefined;
  room.secretWord = undefined;
  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    drawerId: room.drawerId,
    guesses: room.guesses.map((g) => ({ ...g })),
    scores: { ...room.scores },
    participants: room.participants.map((p) => ({ ...p })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  // During playing: only the drawer sees the secret word
  // During result: everyone sees the correct word (round is over)
  if (room.secretWord) {
    if (room.status === "result" || viewerParticipantId === room.drawerId) {
      snapshot.secretWord = room.secretWord;
    }
  }

  return snapshot;
}
