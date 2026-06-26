import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  drawStrokesSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import { addStrokes, clearStrokes, createRoom, getRoom, joinRoom, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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
      const { playerId } = startGameSchema.parse(request.body);
      const upperCode = code.toUpperCase();

      const room = getRoom(upperCode);
      if (!room) {
        throw new HttpError(404, "Room not found");
      }
      if (room.status !== "lobby") {
        throw new HttpError(400, "Game has already started");
      }
      if (room.hostId !== playerId) {
        throw new HttpError(403, "Only the host can start the game");
      }
      if (room.participants.length < 2) {
        throw new HttpError(400, "At least 2 players are required to start");
      }

      const updatedRoom = startGame(upperCode);
      if (!updatedRoom) {
        throw new HttpError(500, "Failed to start game");
      }

      response.json({
        room: toRoomSnapshot(updatedRoom, playerId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, strokes } = drawStrokesSchema.parse(request.body);
      const upperCode = code.toUpperCase();

      const room = getRoom(upperCode);
      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "playing") throw new HttpError(400, "Game is not in progress");
      if (room.drawerId !== participantId) throw new HttpError(403, "Only the drawer can draw");

      const updatedRoom = addStrokes(upperCode, participantId, strokes);
      if (!updatedRoom) throw new HttpError(500, "Failed to add strokes");

      response.json({ strokes: updatedRoom.strokes });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const upperCode = code.toUpperCase();

      const room = getRoom(upperCode);
      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "playing") throw new HttpError(400, "Game is not in progress");
      if (room.drawerId !== participantId) throw new HttpError(403, "Only the drawer can clear the canvas");

      const updatedRoom = clearStrokes(upperCode, participantId);
      if (!updatedRoom) throw new HttpError(500, "Failed to clear canvas");

      response.json({ strokes: [] });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const upperCode = code.toUpperCase();

      const room = getRoom(upperCode);
      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "playing") throw new HttpError(400, "Game is not in progress");

      const result = submitGuess(upperCode, participantId, guess);
      if ("error" in result) {
        throw new HttpError(400, result.error??"Invalid guess");
      }

      response.json({
        correct: result.correct,
        message: result.message,
        guessEntry: result.guessEntry
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
