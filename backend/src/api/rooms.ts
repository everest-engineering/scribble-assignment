import { Router } from "express";
import {
  clearBodySchema,
  createRoomSchema,
  guessBodySchema,
  HttpError,
  joinRoomSchema,
  restartQuerySchema,
  revealQuerySchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameQuerySchema,
  strokeBodySchema
} from "./schemas.js";
import { addStroke, clearCanvas, createRoom, getRoom, joinRoom, restartGame, revealRound, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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
      const { participantId } = startGameQuerySchema.parse(request.query);
      const result = startGame(code.toUpperCase(), participantId);

      if (!result) {
        throw new HttpError(403, "Unable to start game");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/reveal", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = revealQuerySchema.parse(request.query);
      const result = revealRound(code.toUpperCase(), participantId);

      if (!result) {
        throw new HttpError(403, "Unable to reveal round");
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
      const { participantId } = restartQuerySchema.parse(request.query);
      const result = restartGame(code.toUpperCase(), participantId);

      if (!result) {
        throw new HttpError(403, "Unable to restart game");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/stroke", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, points } = strokeBodySchema.parse(request.body);
      const result = addStroke(code.toUpperCase(), participantId, points);

      if (!result.ok) {
        throw new HttpError(result.status, result.message);
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearBodySchema.parse(request.body);
      const result = clearCanvas(code.toUpperCase(), participantId);

      if (!result.ok) {
        throw new HttpError(result.status, result.message);
      }

      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = guessBodySchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if ("error" in result) {
        const status = result.error === "Only guessers can submit guesses" ? 403 : 400;
        throw new HttpError(status, result.error as string);
      }

      response.json(result);
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
