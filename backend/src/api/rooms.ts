import { Router } from "express";
import {
  clearDrawBodySchema,
  createRoomSchema,
  drawBodySchema,
  endRoundBodySchema,
  guessBodySchema,
  HttpError,
  joinRoomSchema,
  restartBodySchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameBodySchema,
  startGameParamsSchema
} from "./schemas.js";
import {
  clearDrawing,
  createRoom,
  endRound,
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
      const { participantId } = startGameBodySchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessBodySchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/draw", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, drawingData } = drawBodySchema.parse(request.body);
      const result = saveDrawing(code.toUpperCase(), participantId, drawingData);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearDrawBodySchema.parse(request.body);
      const result = clearDrawing(code.toUpperCase(), participantId);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundBodySchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartBodySchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if (result.error) {
        throw new HttpError(400, result.error);
      }

      response.json({
        room: toRoomSnapshot(result.room!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
