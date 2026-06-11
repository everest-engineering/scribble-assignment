import { randomUUID } from "node:crypto";
import type {
  Guess,
  Participant,
  ParticipantView,
  Room,
  RoomSnapshot,
  RoundView
} from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

export function isGuessCorrect(text: string, secretWord: string): boolean {
  return text.trim().toLowerCase() === secretWord.trim().toLowerCase();
}

export function selectWordForRound(
  words: readonly string[],
  roundNumber: number
): string {
  if (words.length === 0) {
    throw new Error("No words available");
  }
  return words[(roundNumber - 1) % words.length];
}

function buildMaskedWord(secretWord: string): string {
  return secretWord.replace(/[^ ]/g, "_");
}

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
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
  return {
    id: randomUUID(),
    name: name.trim(),
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
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostParticipantId: participant.id,
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
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(normalizeCode(code));
  return room ? cloneRoom(room) : null;
}

export type StartRoomOutcome =
  | { ok: true; room: Room }
  | { ok: false; reason: "not_found" | "not_host" | "not_enough_players" };

export function startRoom(code: string, requesterId: string): StartRoomOutcome {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.hostParticipantId !== requesterId) {
    return { ok: false, reason: "not_host" };
  }

  // Idempotency: if a round already exists, return the existing room unchanged.
  if (room.round !== null) {
    return { ok: true, room: cloneRoom(room) };
  }

  if (room.participants.length < 2) {
    return { ok: false, reason: "not_enough_players" };
  }

  room.round = {
    roundNumber: 1,
    drawerParticipantId: room.hostParticipantId,
    secretWord: selectWordForRound(STARTER_WORDS, 1),
    guesses: [],
    scores: Object.fromEntries(room.participants.map((p) => [p.id, 0])),
    lockedParticipantIds: []
  };
  room.status = "round";
  room.updatedAt = now();

  return { ok: true, room: cloneRoom(room) };
}

export type SubmitGuessOutcome =
  | { ok: true; room: Room; guess: Guess }
  | {
      ok: false;
      reason:
        | "not_found"
        | "no_round"
        | "not_in_room"
        | "is_drawer"
        | "already_correct";
    };

export function submitGuess(
  code: string,
  requesterId: string,
  text: string
): SubmitGuessOutcome {
  const room = rooms.get(normalizeCode(code));

  if (!room) {
    return { ok: false, reason: "not_found" };
  }

  if (room.round === null) {
    return { ok: false, reason: "no_round" };
  }

  const participant = room.participants.find((p) => p.id === requesterId);
  if (!participant) {
    return { ok: false, reason: "not_in_room" };
  }

  if (requesterId === room.round.drawerParticipantId) {
    return { ok: false, reason: "is_drawer" };
  }

  if (room.round.lockedParticipantIds.includes(requesterId)) {
    return { ok: false, reason: "already_correct" };
  }

  const trimmed = text.trim();
  const correct = isGuessCorrect(trimmed, room.round.secretWord);

  const guess: Guess = {
    id: randomUUID(),
    participantId: requesterId,
    displayName: participant.name,
    text: trimmed,
    isCorrect: correct,
    submittedAt: now()
  };

  room.round.guesses.push(guess);

  if (correct) {
    const current = room.round.scores[requesterId] ?? 0;
    room.round.scores[requesterId] = current + 100;
    room.round.lockedParticipantIds.push(requesterId);
  }

  room.updatedAt = now();

  return { ok: true, room: cloneRoom(room), guess: { ...guess } };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const viewerIsHost =
    Boolean(viewerParticipantId) && viewerParticipantId === room.hostParticipantId;

  const drawerId = room.round?.drawerParticipantId ?? null;

  const participants: ParticipantView[] = room.participants.map((participant) => ({
    ...participant,
    isHost: participant.id === room.hostParticipantId,
    isDrawer: drawerId !== null && participant.id === drawerId
  }));

  let round: RoundView | null = null;
  if (room.round !== null) {
    const activeRound = room.round;
    const viewerIsDrawer =
      viewerParticipantId !== undefined &&
      viewerParticipantId === activeRound.drawerParticipantId;

    round = {
      roundNumber: activeRound.roundNumber,
      drawerParticipantId: activeRound.drawerParticipantId,
      maskedWord: buildMaskedWord(activeRound.secretWord),
      guesses: activeRound.guesses.map((g) => ({ ...g })),
      scores: { ...activeRound.scores },
      lockedParticipantIds: [...activeRound.lockedParticipantIds]
    };

    if (viewerIsDrawer) {
      round.secretWord = activeRound.secretWord;
    }
  }

  return {
    code: room.code,
    status: room.status,
    participants,
    hostParticipantId: room.hostParticipantId,
    viewerIsHost,
    canStart: viewerIsHost && room.round === null && room.participants.length >= 2,
    // In-round, hide the cleartext word list from non-drawer payloads (FR-005).
    // Drawers already see the secret word; we still empty the list to keep the wire shape uniform across viewers.
    availableWords: room.round === null ? listWords() : [],
    roles: [...STARTER_ROLES],
    round
  };
}

export function __resetRoomsForTests() {
  rooms.clear();
}
