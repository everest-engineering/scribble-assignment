import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  updateCanvasSchema,
  clearCanvasSchema,
  submitGuessSchema,
  endRoundSchema,
  restartGameSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, startGame, toRoomSnapshot, addStroke, clearCanvas, submitGuess, endRound, restartGame, GameError } from "../services/roomStore.js";

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
      const upperCode = code.toUpperCase();
      const existingRoom = getRoom(upperCode);

      if (!existingRoom) {
        throw new HttpError(404, "Unable to join room");
      }

      if (existingRoom.status === "playing" || existingRoom.status === "results") {
        throw new HttpError(409, "Game already in progress");
      }

      const result = joinRoom(upperCode, playerName);

      if (!result) {
        throw new HttpError(404, "Unable to join room");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
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
        room: toRoomSnapshot(room, participantId ?? undefined)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const room = startGame(code.toUpperCase(), participantId);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof GameError) {
        const statusCode =
          error.code === "NOT_FOUND" ? 404 :
            error.code === "FORBIDDEN" ? 403 :
              409;
        next(new HttpError(statusCode, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = updateCanvasSchema.parse(request.body);
      const room = addStroke(code.toUpperCase(), participantId, stroke);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof GameError) {
        const statusCode =
          error.code === "NOT_FOUND" ? 404 :
            error.code === "FORBIDDEN" ? 403 :
              409;
        next(new HttpError(statusCode, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const room = clearCanvas(code.toUpperCase(), participantId);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof GameError) {
        const statusCode =
          error.code === "NOT_FOUND" ? 404 :
            error.code === "FORBIDDEN" ? 403 :
              409;
        next(new HttpError(statusCode, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, guess);

      response.json({
        guess: result.guess,
        scoreAwarded: result.scoreAwarded,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      if (error instanceof GameError) {
        const statusCode =
          error.code === "NOT_FOUND" ? 404 :
            error.code === "FORBIDDEN" ? 403 :
              409;
        next(new HttpError(statusCode, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const room = endRound(code.toUpperCase(), participantId);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof GameError) {
        const statusCode =
          error.code === "NOT_FOUND" ? 404 :
            error.code === "FORBIDDEN" ? 403 :
              409;
        next(new HttpError(statusCode, error.message));
        return;
      }
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);
      const room = restartGame(code.toUpperCase(), participantId);

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof GameError) {
        const statusCode =
          error.code === "NOT_FOUND" ? 404 :
            error.code === "FORBIDDEN" ? 403 :
              409;
        next(new HttpError(statusCode, error.message));
        return;
      }
      next(error);
    }
  });

  return router;
}
