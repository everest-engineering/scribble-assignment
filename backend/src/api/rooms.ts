import { Router } from "express";
import {
  clearDrawingSchema,
  createRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  saveDrawingSchema,
  startGameSchema
} from "./schemas.js";

import {
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  saveDrawing,
  startGame,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

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

      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Room code does not exist");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);

      const { participantId, guess } = guessSchema.parse(request.body);

      const room = submitGuess(
        code.toUpperCase(),
        participantId,
        guess
      );

      if (!room) {
        throw new HttpError(404, "Unable to submit guess");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, points } = saveDrawingSchema.parse(request.body);

      const room = saveDrawing(code.toUpperCase(), participantId, points);

      if (!room) {
        throw new HttpError(400, "Unable to save drawing");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearDrawingSchema.parse(request.body);

      const room = clearDrawing(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(400, "Unable to clear drawing");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);

      const room = restartGame(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(400, "Unable to restart game");
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

      const room = startGame(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(400, "Unable to start game");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } =
        roomViewerQuerySchema.parse(request.query);

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

  return router;
}