import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import type { Guess, CanvasEvent } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";
import { selectDeterministicWord } from "./wordSelector.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS ?? "300000");

export function getRoomTtlMs() {
  return Number.isNaN(ROOM_TTL_MS) ? 300000 : ROOM_TTL_MS;
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
  if (name === undefined) return "Player";
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "Player";
}

function createParticipant(name?: string, role?: string): Participant {
  return {
    id: randomUUID(),
    displayName: displayName(name),
    name: displayName(name),
    joinedAt: now(),
    role: role as any
    // joinOrder and isHost will be set by the caller when the participant is
    // added to a Room so the participant has context of the room state.
  } as Participant;
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName, "host");
  // first participant is joinOrder 0 and is host
  participant.joinOrder = 0;
  participant.isHost = true;
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    participants: [participant],
    hostId: participant.id,
    seed: randomUUID(),
    starterWordList: listWords(),
    guesses: [],
    canvasEvents: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  console.info(
    `[roomStore] createRoom code=${room.code} hostId=${participant.id} name=${participant.name}`
  );

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
    return { reason: "not-lobby" } as const;
  }

  const participant = createParticipant(playerName, "player");
  // set joinOrder based on current participants length
  participant.joinOrder = room.participants.length;
  participant.isHost = false;
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  console.info(
    `[roomStore] joinRoom code=${room.code} participantId=${participant.id} name=${participant.name}`
  );

  return {
    room: cloneRoom(room),
    participantId: participant.id
  } as const;
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  console.debug(`[roomStore] saveRoom code=${room.code}`);
  return getRoom(room.code);
}

export function reconnectParticipant(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return { reason: "not-found" } as const;

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) return { reason: "not-found" } as const;

  // refresh joinedAt to indicate active reconnection
  participant.joinedAt = now();
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  console.info(
    `[roomStore] reconnectParticipant code=${room.code} participantId=${participantId}`
  );

  return { room: cloneRoom(room), participantId: participant.id } as const;
}

export function restartRoom(code: string, participantId: string) {
  const room = rooms.get(code);
  if (!room) return { reason: "not-found" } as const;
  if (room.hostId !== participantId) return { reason: "not-host" } as const;

  // capture summary for the last round
  const finalScores = room.participants.map((p) => ({
    participantId: p.id,
    score: (p as any).score as number | undefined
  }));

  room.lastRoundSummary = {
    word: room.secretWord,
    drawerId: room.drawerId,
    finalScores,
    guesses: room.guesses ? [...room.guesses] : [],
    endedAt: now()
  };

  // clear transient per-round state but preserve participants and host
  delete room.secretWord;
  delete room.drawerId;
  room.guesses = [];
  room.canvasEvents = [];
  room.status = "lobby";
  room.roundIndex = undefined;

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  console.info(`[roomStore] restartRoom code=${room.code} by=${participantId}`);

  return { room: cloneRoom(room) } as const;
}

export function toRoomSnapshot(
  room: Room,
  viewerParticipantId?: string
): RoomSnapshot {
  const snapshot: RoomSnapshot = {
    code: room.code,
    status: room.status,
    drawerId: room.drawerId,
    hostId: room.hostId,
    participants: room.participants.map((participant) => ({ ...participant })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };

  // Only include the secret word when the viewer is the drawer
  if (
    viewerParticipantId &&
    room.drawerId &&
    viewerParticipantId === room.drawerId
  ) {
    snapshot.secretWord = room.secretWord;
  }

  // include canvas events for all viewers so non-drawers can see read-only updates
  snapshot.canvasEvents = room.canvasEvents ? [...room.canvasEvents] : [];

  return snapshot;
}

export function submitGuess(
  code: string,
  participantId: string,
  rawText: string
): { guess: Guess; updatedRoom?: Room } | { reason: string } {
  const room = rooms.get(code);

  if (!room) return { reason: "not-found" } as const;
  if (room.status !== "in-game") return { reason: "not-in-game" } as const;

  const textTrimmed = rawText.trim();
  if (textTrimmed.length === 0) return { reason: "empty" } as const;
  if (textTrimmed.length > 200) return { reason: "too-long" } as const;

  const isCorrect =
    !!room.secretWord &&
    textTrimmed.toLowerCase() === room.secretWord.toLowerCase();

  const guess: Guess = {
    playerId: participantId,
    textTrimmed,
    timestamp: now(),
    isCorrect
  };

  room.guesses = room.guesses ?? [];
  room.guesses.push(guess);

  // award points for correct guess
  if (isCorrect) {
    const participant = room.participants.find((p) => p.id === participantId);
    // simple score stored on participant as `score` (create if missing)
    if (participant) {
      // @ts-expect-error add score dynamically
      participant.score = (participant as any).score
        ? (participant as any).score + 100
        : 100;
    }
  }

  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));

  return { guess, updatedRoom: cloneRoom(room) } as const;
}

export function getGuesses(code: string) {
  const room = rooms.get(code);
  if (!room) return null;
  return room.guesses ? [...room.guesses] : [];
}

export function appendCanvasEvent(
  code: string,
  participantId: string,
  event: CanvasEvent
) {
  const room = rooms.get(code);
  if (!room) return { reason: "not-found" } as const;
  if (room.drawerId !== participantId)
    return { reason: "not-authorized" } as const;
  room.canvasEvents = room.canvasEvents ?? [];
  room.canvasEvents.push(event);
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return { ok: true } as const;
}

export function assignDrawerForFirstRound(room: Room) {
  // choose drawer: prefer host if present, otherwise first participant by join order
  let drawerId = room.hostId;
  if (!drawerId || !room.participants.some((p) => p.id === drawerId)) {
    drawerId = room.participants[0]?.id;
  }

  room.drawerId = drawerId;
  return drawerId;
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { reason: "not-found" } as const;
  }

  if (room.hostId !== participantId) {
    return { reason: "not-host" } as const;
  }

  if (room.participants.length < 2) {
    return { reason: "not-enough" } as const;
  }

  // Prevent starting if there are no starter words configured
  if (!room.starterWordList || room.starterWordList.length === 0) {
    return { reason: "no-words" } as const;
  }

  if (room.status === "in-game") {
    return { reason: "already-in-game" } as const;
  }

  // initialize the first round
  room.status = "in-game";
  room.roundIndex = 1;

  // assign drawer and pick secret word
  const drawerId = assignDrawerForFirstRound(room);
  try {
    room.secretWord = selectDeterministicWord(
      room.seed ?? "",
      room.roundIndex ?? 0,
      room.starterWordList && room.starterWordList.length > 0
        ? room.starterWordList
        : STARTER_WORDS
    );
  } catch (e) {
    // fallback to first word on error
    room.secretWord = STARTER_WORDS[0];
  }
  room.updatedAt = now();
  rooms.set(room.code, room);

  console.info(
    `[roomStore] startGame code=${room.code} startedBy=${participantId}`
  );

  return { room: cloneRoom(room) } as const;
}

export function cleanupInactiveRooms() {
  const ttl = getRoomTtlMs();
  const nowTs = Date.now();
  const removed: string[] = [];

  for (const [code, room] of rooms.entries()) {
    const updated = new Date(room.updatedAt).getTime();
    if (Number.isNaN(updated)) continue;
    if (nowTs - updated > ttl) {
      rooms.delete(code);
      removed.push(code);
      console.info(`[roomStore] cleanupInactiveRooms removed=${code}`);
    }
  }

  return removed;
}
