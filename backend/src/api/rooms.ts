import { Router } from "express";
import {
  createRoomSchema,
  drawStrokesSchema,
  guessSubmissionSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  joinRoom,
  saveStrokes,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

function normalizeCode(raw: string) {
  return raw.trim().toUpperCase();
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      if (!result) {
        throw new HttpError(503, "Maximum number of rooms reached");
      }

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(normalizeCode(code), playerName);

      if (!result) {
        const room = getRoom(normalizeCode(code));

        if (!room) {
          throw new HttpError(404, "Room not found");
        }

        if (room.status !== "lobby") {
          throw new HttpError(403, "Game already in progress");
        }

        throw new HttpError(403, "Room is full");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const room = startGame(normalizeCode(code), participantId);

      if (!room) {
        const existing = getRoom(normalizeCode(code));

        if (!existing) {
          throw new HttpError(404, "Room not found");
        }

        if (existing.hostId !== participantId) {
          throw new HttpError(403, "Only the host can start the game");
        }

        if (existing.participants.length < 2) {
          throw new HttpError(403, "At least 2 players are needed to start");
        }

        const validName = (name: string) => /^[a-zA-Z0-9]+$/.test(name.trim()) && name.trim().length >= 1 && name.trim().length <= 16;
        const hasInvalidName = existing.participants.some((p) => !validName(p.name));

        if (hasInvalidName) {
          throw new HttpError(400, "All players must have a valid name to start the game");
        }

        throw new HttpError(503, "Game cannot start: word list is unavailable");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

router.post("/:code/draw", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId, strokes } = drawStrokesSchema.parse(request.body);
    const room = saveStrokes(normalizeCode(code), participantId, strokes);

    if (!room) {
      const existing = getRoom(normalizeCode(code));

      if (!existing) {
        throw new HttpError(404, "Room not found");
      }

      throw new HttpError(403, "Only the drawer can update the canvas");
    }

    response.json({
      room: toRoomSnapshot(room, participantId)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:code/guess", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId, text } = guessSubmissionSchema.parse(request.body);
    const result = submitGuess(normalizeCode(code), participantId, text);

    if (!result) {
      const existing = getRoom(normalizeCode(code));

      if (!existing) {
        throw new HttpError(404, "Room not found");
      }

      if (existing.currentRound?.drawerId === participantId) {
        throw new HttpError(403, "Drawer cannot submit guesses");
      }

      if (existing.currentRound?.correctGuessers.includes(participantId)) {
        throw new HttpError(403, "You have already guessed the word correctly");
      }

      throw new HttpError(403, "Cannot submit guess");
    }

    const guesserName = result.room.participants.find((p) => p.id === participantId)?.name ?? "Unknown";

    response.json({
      guess: {
        participantId: result.guess.participantId,
        guesserName,
        text: result.guess.text,
        submittedAt: result.guess.submittedAt,
        isCorrect: result.guess.isCorrect
      },
      room: toRoomSnapshot(result.room, participantId)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:code", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(normalizeCode(code));

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
