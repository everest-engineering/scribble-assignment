import { Router } from "express";
import {
  appendStrokeSchema,
  clearDrawingSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  appendStroke,
  clearStrokes,
  createRoom,
  getRoom,
  joinRoom,
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
      const result = joinRoom(code, playerName);

      if (result.status === "not_found") {
        throw new HttpError(404, "Room not found");
      }

      if (result.status === "in_progress") {
        throw new HttpError(409, "Game already in progress");
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
      const result = startGame(code, participantId);

      if (result.status === "not_found") {
        throw new HttpError(404, "Room not found");
      }

      if (result.status === "not_host") {
        throw new HttpError(403, "Only the host can start the game");
      }

      if (result.status === "not_enough_players") {
        throw new HttpError(400, "At least two players are required");
      }

      if (result.status === "already_started") {
        throw new HttpError(409, "Game already started");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = appendStrokeSchema.parse(request.body);
      const result = appendStroke(code, participantId, stroke);

      if (result.status === "not_found") {
        throw new HttpError(404, "Room not found");
      }

      if (result.status === "not_playing") {
        throw new HttpError(409, "Game is not in progress");
      }

      if (result.status === "not_drawer") {
        throw new HttpError(403, "Only the drawer can draw");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearDrawingSchema.parse(request.body);
      const result = clearStrokes(code, participantId);

      if (result.status === "not_found") {
        throw new HttpError(404, "Room not found");
      }

      if (result.status === "not_playing") {
        throw new HttpError(409, "Game is not in progress");
      }

      if (result.status === "not_drawer") {
        throw new HttpError(403, "Only the drawer can clear the canvas");
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
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code, participantId, guess);

      if (result.status === "not_found") {
        throw new HttpError(404, "Room not found");
      }

      if (result.status === "not_playing") {
        throw new HttpError(409, "Game is not in progress");
      }

      if (result.status === "not_participant") {
        throw new HttpError(403, "Participant not in room");
      }

      if (result.status === "is_drawer") {
        throw new HttpError(403, "The drawer cannot submit guesses");
      }

      if (result.status === "invalid_guess") {
        throw new HttpError(400, result.message);
      }

      response.json({
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
