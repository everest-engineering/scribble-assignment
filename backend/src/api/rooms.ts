import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  drawStrokeSchema,
  HttpError,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addStroke,
  clearDrawing,
  createRoom,
  endRound,
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
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

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
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = drawStrokeSchema.parse(request.body);
      const result = addStroke(code.toUpperCase(), participantId, stroke);

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearDrawing(code.toUpperCase(), participantId);

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

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

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
