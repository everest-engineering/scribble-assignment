import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  guessSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  strokeSchema
} from "./schemas.js";
import {
  addStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  restartRoom,
  startRoom,
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
      const result = joinRoom(code, playerName);

      if (!result) {
        throw new HttpError(404, "Room not found");
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
      const result = startRoom(code, participantId);

      if (!result.ok) {
        if (result.reason === "not-found") {
          throw new HttpError(404, "Room not found");
        }

        if (result.reason === "forbidden") {
          throw new HttpError(403, "Only the host can start the game");
        }

        throw new HttpError(422, "At least 2 players are required to start");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = strokeSchema.parse(request.body);
      const result = addStroke(code, participantId, stroke);

      if (!result.ok) {
        if (result.reason === "not-found") {
          throw new HttpError(404, "Room not found");
        }

        if (result.reason === "forbidden") {
          throw new HttpError(403, "Only the drawer can draw");
        }

        throw new HttpError(409, "The round has ended");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearCanvas(code, participantId);

      if (!result.ok) {
        if (result.reason === "not-found") {
          throw new HttpError(404, "Room not found");
        }

        if (result.reason === "forbidden") {
          throw new HttpError(403, "Only the drawer can draw");
        }

        throw new HttpError(409, "The round has ended");
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
      const { participantId } = restartRoomSchema.parse(request.body);
      const result = restartRoom(code, participantId);

      if (!result.ok) {
        if (result.reason === "not-found") {
          throw new HttpError(404, "Room not found");
        }

        if (result.reason === "forbidden") {
          throw new HttpError(403, "Only the host can restart the game");
        }

        throw new HttpError(409, "The round is still in progress");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = guessSchema.parse(request.body);
      const result = submitGuess(code, participantId, guess);

      if (!result.ok) {
        if (result.reason === "not-found") {
          throw new HttpError(404, "Room not found");
        }

        if (result.reason === "forbidden") {
          throw new HttpError(403, "Only guessers can submit guesses");
        }

        throw new HttpError(409, "The round has ended");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId),
        correct: result.correct
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code);

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
