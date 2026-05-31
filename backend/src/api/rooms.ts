import { Router } from "express";
import {
  createRoomSchema,
  endRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema
} from "./schemas.js";
import { createRoom, endGame, getRoom, joinRoom, restartGame, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if (result.code === "NOT_FOUND") throw new HttpError(404, "Room not found");
      if (result.code === "FORBIDDEN") throw new HttpError(403, "Only the host can start the game");
      if (result.code === "CONFLICT") throw new HttpError(409, "Game has already started");
      if (result.code === "BAD_REQUEST") throw new HttpError(400, "Need at least 2 players to start");

      response.json({
        participantId,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoomSchema.parse(request.body);
      const result = endGame(code.toUpperCase(), participantId);

      if (result.code === "NOT_FOUND") throw new HttpError(404, "Room not found");
      if (result.code === "FORBIDDEN") throw new HttpError(403, "Only the host can end the game");
      if (result.code === "CONFLICT") throw new HttpError(409, "Game is not currently playing");

      response.json({ participantId, room: toRoomSnapshot(result.room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if (result.code === "NOT_FOUND") throw new HttpError(404, "Room not found");
      if (result.code === "FORBIDDEN") throw new HttpError(403, "Only the host can restart the game");
      if (result.code === "CONFLICT") throw new HttpError(409, "Game is not in results state");

      response.json({ participantId, room: toRoomSnapshot(result.room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = guessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, guess);

      if (result.code === "NOT_FOUND") throw new HttpError(404, "Room not found");
      if (result.code === "FORBIDDEN") throw new HttpError(403, result.message);
      if (result.code === "BAD_REQUEST") throw new HttpError(400, result.message);

      response.json({ room: toRoomSnapshot(result.room, participantId) });
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

  return router;
}
