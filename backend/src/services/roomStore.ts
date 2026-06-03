import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

export type StartRoomError = { error: "not-host" } | { error: "needs-quorum" };
export type StartRoomResult =
  | { room: Room; participantId: string }
  | StartRoomError
  | null;

export type JoinRoomResult =
  | { room: Room; participantId: string }
  | { error: "room-not-open" }
  | null;

export type SubmitGuessResult =
  | { room: Room; guessId: string }
  | { error: "not-playing" }
  | { error: "is-drawer" }
  | null;

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
    name,
    joinedAt: now(),
    score: 0
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function selectWord(code: string): string {
  let sum = 0;
  for (let index = 0; index < code.length; index += 1) {
    sum += code.charCodeAt(index);
  }
  return STARTER_WORDS[sum % STARTER_WORDS.length];
}

export function createRoom(playerName: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostParticipantId: participant.id,
    participants: [participant],
    currentRound: null,
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

export function joinRoom(code: string, playerName: string): JoinRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "lobby") {
    return { error: "room-not-open" };
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

export function startRoom(code: string, participantId: string): StartRoomResult {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (participantId !== room.hostParticipantId) {
    return { error: "not-host" };
  }

  if (room.status === "playing" && room.currentRound) {
    return {
      room: cloneRoom(room),
      participantId
    };
  }

  if (room.participants.length < 2) {
    return { error: "needs-quorum" };
  }

  for (const participant of room.participants) {
    participant.score = 0;
  }
  room.guesses = [];
  room.status = "playing";
  room.currentRound = {
    drawerParticipantId: room.hostParticipantId,
    secretWord: selectWord(room.code)
  };
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId
  };
}

export function submitGuess(
  code: string,
  participantId: string,
  text: string
): SubmitGuessResult {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (room.status !== "playing" || !room.currentRound) {
    return { error: "not-playing" };
  }

  if (participantId === room.currentRound.drawerParticipantId) {
    return { error: "is-drawer" };
  }

  const isCorrect =
    text.toLowerCase() === room.currentRound.secretWord.toLowerCase();

  const hadPriorCorrect = room.guesses.some(
    (entry) =>
      entry.guesserParticipantId === participantId && entry.isCorrect
  );

  if (isCorrect && !hadPriorCorrect) {
    const guesser = room.participants.find((p) => p.id === participantId);
    if (guesser) {
      guesser.score += 100;
    }
  }

  const guess = {
    id: randomUUID(),
    guesserParticipantId: participantId,
    text,
    isCorrect,
    submittedAt: now(),
    order: room.guesses.length
  };

  room.guesses.push(guess);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    guessId: guess.id
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

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const round = room.currentRound;
  const snapshotRound = round
    ? {
        drawerParticipantId: round.drawerParticipantId,
        secretWord:
          viewerParticipantId === round.drawerParticipantId ? round.secretWord : null
      }
    : null;

  const drawerId = round?.drawerParticipantId;
  const snapshotGuesses = room.guesses.map((entry) => {
    const isPrivilegedViewer =
      viewerParticipantId === entry.guesserParticipantId ||
      (drawerId !== undefined && viewerParticipantId === drawerId);
    const text = entry.isCorrect && !isPrivilegedViewer ? null : entry.text;
    return {
      id: entry.id,
      guesserParticipantId: entry.guesserParticipantId,
      text,
      isCorrect: entry.isCorrect,
      submittedAt: entry.submittedAt,
      order: entry.order
    };
  });

  return {
    code: room.code,
    status: room.status,
    hostParticipantId: room.hostParticipantId,
    participants: room.participants.map((participant) => ({ ...participant })),
    currentRound: snapshotRound,
    guesses: snapshotGuesses,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}
