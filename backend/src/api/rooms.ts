import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startSchema,
  guessSchema,
  restartSchema
  , strokeSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, toRoomSnapshot, startRound, submitGuess, restartRound, addStroke } from "../services/roomStore.js";

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
      const { participantId } = startSchema.parse(request.body);

      const room = startRound(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Unable to start room");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = guessSchema.parse(request.body);

      const room = submitGuess(code.toUpperCase(), participantId, guess);

      if (!room) {
        throw new HttpError(404, "Unable to submit guess");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, points, color } = strokeSchema.parse(request.body);

      const room = addStroke(code.toUpperCase(), participantId, points, color);

      if (!room) {
        throw new HttpError(404, "Unable to add stroke");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartSchema.parse(request.body);

      const room = restartRound(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Unable to restart room");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

