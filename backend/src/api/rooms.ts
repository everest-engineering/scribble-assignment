import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  endRoundSchema,
  HttpError,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  saveCanvasSchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import { clearCanvasState, createRoom, endRound, getCanvasState, getGuesses, getRoom, joinRoom, restartGame, saveCanvasState, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);
      const snapshot = toRoomSnapshot(result.room, result.participantId);

      response.status(201).json({
        participantId: result.participantId,
        isHost: snapshot.hostId === result.participantId,
        room: snapshot
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Unable to join room");
      }

      const snapshot = toRoomSnapshot(result.room, result.participantId);

      response.json({
        participantId: result.participantId,
        isHost: snapshot.hostId === result.participantId,
        room: snapshot
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

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

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        const message =
          result.error === 400
            ? "Need at least 2 players to start"
            : result.error === 403
              ? "Only the host can start the game"
              : result.error === 404
                ? "Room not found"
                : "Unable to start game";

        throw new HttpError(result.error, message);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const strokes = getCanvasState(code.toUpperCase());

      if (strokes === null) {
        throw new HttpError(404, "Room not found");
      }

      response.json({ strokes });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, strokes } = saveCanvasSchema.parse(request.body);
      const ok = saveCanvasState(code.toUpperCase(), participantId, strokes);

      if (!ok) {
        throw new HttpError(403, "Only the drawer can save the canvas");
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const ok = clearCanvasState(code.toUpperCase(), participantId);

      if (!ok) {
        throw new HttpError(403, "Only the drawer can clear the canvas");
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const guesses = getGuesses(code.toUpperCase());

      if (guesses === null) {
        throw new HttpError(404, "Room not found");
      }

      response.json({ guesses });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if (!result) {
        throw new HttpError(404, "Room not found");
      }

      if (result.result === "error") {
        throw new HttpError(400, result.error ?? "Unable to process guess");
      }

      response.json({
        result: result.result,
        guess: result.guess,
        scores: result.scores,
        guesses: result.guesses,
        roomStatus: result.roomStatus
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

      if (!result.ok) {
        const message =
          result.error === 404
            ? "Room not found"
            : result.error === 403
              ? "Only the drawer can end the round"
              : "Unable to end round";

        throw new HttpError(result.error, message);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if (!result.ok) {
        const message =
          result.error === 404
            ? "Room not found"
            : result.error === 403
              ? "Only the host can restart the game"
              : "Unable to restart game";

        throw new HttpError(result.error, message);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
