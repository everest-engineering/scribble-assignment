import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  restartRoomSchema,
  submitGuessSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, restartRoom, startRoom, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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
      const { participantId } = startRoomSchema.parse(request.body);
      const room = startRoom(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof HttpError) {
        return next(error);
      }
      if (error instanceof Error) {
        if (error.message === "Only the host can start the game") {
          return next(new HttpError(403, error.message));
        }
        if (error.message === "Need at least 2 players to start") {
          return next(new HttpError(400, error.message));
        }
      }
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const room = submitGuess(code.toUpperCase(), participantId, text);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof HttpError) {
        return next(error);
      }
      if (error instanceof Error) {
        if (error.message === "Guess cannot be empty") {
          return next(new HttpError(400, error.message));
        }
        if (error.message === "Drawer cannot submit guesses") {
          return next(new HttpError(403, error.message));
        }
        if (error.message === "Game is not active") {
          return next(new HttpError(400, error.message));
        }
        if (error.message === "Participant not found") {
          return next(new HttpError(404, error.message));
        }
      }
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const room = restartRoom(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({ room: toRoomSnapshot(room, participantId) });
    } catch (error) {
      if (error instanceof HttpError) {
        return next(error);
      }
      if (error instanceof Error) {
        if (error.message === "Only the host can restart") {
          return next(new HttpError(403, error.message));
        }
      }
      next(error);
    }
  });

  return router;
}
