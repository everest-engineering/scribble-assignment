import { Router } from "express";
import {
  createRoomSchema,
  guessSubmissionSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  strokesSubmissionSchema,
  wordSelectionSchema
} from "./schemas.js";
import { addStroke, clearStrokes, createRoom, getRoom, joinRoom, restartGame, selectWord, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

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
      const result = joinRoom(code, playerName);

      if (!result) {
        throw new HttpError(404, "Room not found. Check the code and try again.");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Game already in progress") {
        next(new HttpError(400, "Game already in progress"));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code, participantId);

      if (!result) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(result, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the host can start the game") {
        next(new HttpError(403, "Only the host can start the game"));
        return;
      }
      if (error instanceof Error && error.message === "Need at least 2 players to start") {
        next(new HttpError(400, "Need at least 2 players to start"));
        return;
      }
      if (error instanceof Error && error.message === "Game has already started") {
        next(new HttpError(400, "Game has already started"));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/select-word", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, word } = wordSelectionSchema.parse(request.body);
      const result = selectWord(code, participantId, word);

      if (!result) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(result, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the drawer can select a word") {
        next(new HttpError(403, "Only the drawer can select a word"));
        return;
      }
      if (error instanceof Error && error.message === "Invalid word selection") {
        next(new HttpError(400, "Invalid word selection"));
        return;
      }
      if (error instanceof Error && error.message === "Word already selected") {
        next(new HttpError(400, "Word already selected"));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, strokes } = strokesSubmissionSchema.parse(request.body);
      const result = addStroke(code, participantId, strokes);

      if (!result) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(result, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the drawer can submit strokes") {
        next(new HttpError(403, "Only the drawer can submit strokes"));
        return;
      }
      if (error instanceof Error && error.message === "The round has ended") {
        next(new HttpError(400, "The round has ended"));
        return;
      }
      if (error instanceof Error && error.message === "Round is not in drawing phase") {
        next(new HttpError(400, "Round is not in drawing phase"));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessSubmissionSchema.parse(request.body);
      const result = submitGuess(code, participantId, text);

      if (!result) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({ correct: result.correct });
    } catch (error) {
      if (error instanceof Error && error.message === "The drawer cannot submit guesses") {
        next(new HttpError(403, "The drawer cannot submit guesses"));
        return;
      }
      if (error instanceof Error && error.message === "The round has ended") {
        next(new HttpError(400, "The round has ended"));
        return;
      }
      if (error instanceof Error && error.message === "Game is not in the drawing phase") {
        next(new HttpError(400, "Game is not in the drawing phase"));
        return;
      }
      if (error instanceof Error && error.message === "You have already guessed correctly") {
        next(new HttpError(400, "You have already guessed correctly"));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = restartGame(code, participantId);

      if (!result) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(result, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the host can restart the game") {
        next(new HttpError(403, "Only the host can restart the game"));
        return;
      }
      if (error instanceof Error && error.message === "Round is not finished yet") {
        next(new HttpError(400, "Round is not finished yet"));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/clear-strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = clearStrokes(code, participantId);

      if (!result) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(result, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Only the drawer can clear strokes") {
        next(new HttpError(403, "Only the drawer can clear strokes"));
        return;
      }
      if (error instanceof Error && error.message === "Round is not in drawing phase") {
        next(new HttpError(400, "Round is not in drawing phase"));
        return;
      }
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code);

      if (!room) {
        throw new HttpError(404, "Unable to load room");
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
