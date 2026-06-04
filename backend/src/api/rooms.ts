import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  drawActionSchema,
  HttpError,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addDrawCommands,
  clearDrawCommands,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
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
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { hostId } = startGameSchema.parse(request.body);
      const room = startGame(code.toUpperCase(), hostId);

      if (!room) {
        throw new HttpError(400, "Unable to start game");
      }

      response.json({
        room: toRoomSnapshot(room, hostId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, guess);

      if (!result) {
        throw new HttpError(400, "Unable to submit guess");
      }

      response.json({
        guess: result.guess,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { commands } = drawActionSchema.parse(request.body);
      const room = addDrawCommands(code.toUpperCase(), commands);

      if (!room) {
        throw new HttpError(400, "Unable to apply draw commands");
      }

      response.json({ room: toRoomSnapshot(room) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      clearCanvasSchema.parse(request.body);
      const room = clearDrawCommands(code.toUpperCase());

      if (!room) {
        throw new HttpError(400, "Unable to clear canvas");
      }

      response.json({ room: toRoomSnapshot(room) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { hostId } = restartGameSchema.parse(request.body);
      const room = restartGame(code.toUpperCase(), hostId);

      if (!room) {
        throw new HttpError(400, "Unable to restart game");
      }

      response.json({
        room: toRoomSnapshot(room, hostId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
