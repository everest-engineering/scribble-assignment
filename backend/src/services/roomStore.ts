import { randomUUID } from "node:crypto";
import type { Guess, GuessSnapshot, Participant, Room, RoomSnapshot, RoundSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { selectWord } from "./wordSelection.js";
import { isCorrect } from "./guessEvaluation.js";

const rooms = new Map<string, Room>();

const MAX_PLAYERS = 8;
const PRESENCE_TIMEOUT_MS = 10_000;
const CORRECT_GUESS_POINTS = 100;

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

// Names are validated (trimmed + non-empty) at the API layer (FR-010/FR-011),
// so create/join always pass a real name here. The trim + "Player" fallback
// remains only as a defensive default for any non-validated caller.
function displayName(name?: string) {
  const trimmed = (name ?? "").trim();
  return trimmed || "Player";
}

// Ensure each participant in a room is distinguishable (FR-017).
// On a case-insensitive collision, append " (2)", " (3)", ...
function disambiguateName(base: string, existing: Participant[]) {
  const taken = new Set(existing.map((participant) => participant.name.toLowerCase()));

  if (!taken.has(base.toLowerCase())) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base} (${suffix})`.toLowerCase())) {
    suffix += 1;
  }

  return `${base} (${suffix})`;
}

function createParticipant(name: string | undefined, existing: Participant[] = []): Participant {
  return {
    id: randomUUID(),
    name: disambiguateName(displayName(name), existing),
    joinedAt: now(),
    lastSeenAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

// Remove participants who have not polled within the presence window (FR-010a).
function pruneStaleParticipants(room: Room) {
  const nowMs = Date.now();
  room.participants = room.participants.filter(
    (participant) => nowMs - new Date(participant.lastSeenAt).getTime() <= PRESENCE_TIMEOUT_MS
  );
}

// Close a room when it is empty (FR-015a) or its host has departed (FR-015).
// Returns true if the room was deleted.
function closeIfEmptyOrHostGone(room: Room) {
  const hostPresent = room.participants.some((participant) => participant.id === room.hostId);

  if (room.participants.length === 0 || !hostPresent) {
    rooms.delete(room.code);
    return true;
  }

  return false;
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

export type JoinFailure = "not_found" | "started" | "full";

export function joinRoom(
  code: string,
  playerName?: string
): { room: Room; participantId: string } | { failure: JoinFailure } {
  const room = rooms.get(code);

  if (!room) {
    return { failure: "not_found" };
  }

  // Free up slots held by departed players before checking capacity.
  pruneStaleParticipants(room);
  if (closeIfEmptyOrHostGone(room)) {
    return { failure: "not_found" };
  }

  if (room.status === "playing") {
    return { failure: "started" };
  }

  if (room.participants.length >= MAX_PLAYERS) {
    return { failure: "full" };
  }

  const participant = createParticipant(playerName, room.participants);
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

// Polling read used by GET /rooms/:code — the poll doubles as a heartbeat:
// it refreshes the caller's presence, prunes stale players, and closes the
// room if the host left or everyone is gone. Returns null when the room is
// unknown or was closed (FR-010, FR-010a, FR-015, FR-015a).
export function pollRoom(code: string, viewerParticipantId?: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (viewerParticipantId) {
    const viewer = room.participants.find((participant) => participant.id === viewerParticipantId);
    if (viewer) {
      viewer.lastSeenAt = now();
    }
  }

  pruneStaleParticipants(room);
  if (closeIfEmptyOrHostGone(room)) {
    return null;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return cloneRoom(room);
}

export type StartFailure = "not_found" | "not_host" | "already_started" | "too_few";

export function startGame(
  code: string,
  participantId: string
): { room: Room } | { failure: StartFailure } {
  const room = rooms.get(code);

  if (!room) {
    return { failure: "not_found" };
  }

  // The requester is polling too; treat the start call as a heartbeat then prune.
  const requester = room.participants.find((participant) => participant.id === participantId);
  if (requester) {
    requester.lastSeenAt = now();
  }

  pruneStaleParticipants(room);
  if (closeIfEmptyOrHostGone(room)) {
    return { failure: "not_found" };
  }

  if (room.hostId !== participantId) {
    return { failure: "not_host" };
  }

  if (room.status === "playing") {
    return { failure: "already_started" };
  }

  if (room.participants.length < 2) {
    return { failure: "too_few" };
  }

  // Begin the first round: the host is the drawer (FR-002) and the secret word
  // is chosen deterministically from the starter list (FR-004, FR-005).
  room.status = "playing";
  room.round = {
    number: 1,
    drawerId: room.hostId,
    word: selectWord(room.code, 1),
    guesses: [],
    correctPlayerIds: []
  };
  // Every player starts the round at 0 (FR-006).
  room.participants.forEach((participant) => {
    participant.score = 0;
  });
  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export type GuessFailure = "not_found" | "not_active" | "drawer";

// Record a guesser's submission during the active round. The text is assumed
// already trimmed (the API layer trims and rejects empty before calling here,
// FR-002/FR-003). Correct guesses award 100 once per player per round
// (FR-005, FR-007); every accepted guess is appended to the history (FR-008).
export function submitGuess(
  code: string,
  participantId: string,
  text: string
): { room: Room } | { failure: GuessFailure } {
  const room = rooms.get(code);

  if (!room) {
    return { failure: "not_found" };
  }

  // The guess call doubles as a heartbeat; refresh presence, then prune.
  const guesser = room.participants.find((participant) => participant.id === participantId);
  if (guesser) {
    guesser.lastSeenAt = now();
  }

  pruneStaleParticipants(room);
  if (closeIfEmptyOrHostGone(room)) {
    return { failure: "not_found" };
  }

  if (room.status !== "playing" || !room.round) {
    return { failure: "not_active" };
  }

  // The drawer illustrates the word and cannot score (FR-014).
  if (participantId === room.round.drawerId) {
    return { failure: "drawer" };
  }

  // A guesser who was pruned for inactivity is no longer in the room.
  if (!guesser) {
    return { failure: "not_found" };
  }

  const correct = isCorrect(text, room.round.word);

  // Award 100 only on a player's first correct guess this round (FR-005, FR-007).
  if (correct && !room.round.correctPlayerIds.includes(participantId)) {
    guesser.score += CORRECT_GUESS_POINTS;
    room.round.correctPlayerIds.push(participantId);
  }

  const guess: Guess = {
    id: randomUUID(),
    playerId: participantId,
    playerName: guesser.name,
    text,
    correct,
    createdAt: now()
  };
  room.round.guesses.push(guess);

  room.updatedAt = now();
  rooms.set(room.code, room);

  return { room: cloneRoom(room) };
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

// Project a room for a specific viewer. The secret word is included ONLY when
// the viewer is the drawer; every other viewer receives just the concealed
// blanks and the length, so the word never reaches a guesser (FR-006, FR-007).
function toRoundSnapshot(room: Room, viewerParticipantId?: string): RoundSnapshot | null {
  if (!room.round) {
    return null;
  }

  const { number, drawerId, word, guesses } = room.round;
  const maskedWord = Array.from(word, () => "_").join(" ");

  // Correct guesses are masked for EVERY viewer: the `text` (which equals the
  // secret word) is omitted entirely so the answer never leaks through the feed
  // (FR-011, SC-008). Incorrect guesses are shown verbatim.
  const guessSnapshots = guesses.map((guess) => {
    const base: GuessSnapshot = {
      id: guess.id,
      playerId: guess.playerId,
      playerName: guess.playerName,
      correct: guess.correct
    };

    if (!guess.correct) {
      base.text = guess.text;
    }

    return base;
  });

  const snapshot: RoundSnapshot = {
    number,
    drawerId,
    wordLength: word.length,
    maskedWord,
    guesses: guessSnapshots
  };

  // Only the drawer is told the actual word.
  if (viewerParticipantId && viewerParticipantId === drawerId) {
    snapshot.word = word;
  }

  return snapshot;
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    round: toRoundSnapshot(room, viewerParticipantId),
    roles: [...STARTER_ROLES]
  };
}
