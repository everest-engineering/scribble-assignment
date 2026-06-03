import { Router } from "express";
import {
  createRoomSchema,
  endRoundSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  submitGuessSchema,
  updateCanvasSchema,
} from "./schemas.js";
import {
  createRoom,
  endRound,
  getRoom,
  joinRoom,
  restartRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot,
  updateCanvas,
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId),
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
        room: toRoomSnapshot(result.room, result.participantId),
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
        room: toRoomSnapshot(room, participantId),
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      startRoomSchema.parse(request.body);
      const snapshot = startRoom(code.toUpperCase());

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, strokes } = updateCanvasSchema.parse(request.body);
      const snapshot = updateCanvas(code.toUpperCase(), participantId, strokes);

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const guess = submitGuess(code.toUpperCase(), participantId, text);

      response.status(201).json({ guess });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const snapshot = endRound(code.toUpperCase(), participantId);

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const snapshot = restartRoom(code.toUpperCase(), participantId);

      response.json({ room: snapshot });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
