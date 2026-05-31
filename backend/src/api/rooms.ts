import { Router } from "express";
import {
  createRoomSchema,
  endRoundSchema,
  HttpError,
  joinRoomSchema,
  restartSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  saveStrokeSchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import { clearCanvas, createRoom, endRound, getCanvasStrokes, getGuesses, getRoom, joinRoom, restartGame, saveStroke, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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
      if ("error" in result) {
        throw new HttpError(409, "Game is already in progress");
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

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "Room not found");
        throw new HttpError(403, "Only the host can start the game");
      }

      response.json({ room: toRoomSnapshot(result.room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guessText } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, guessText);

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "not-found");
        if (result.error === "not-in-progress") throw new HttpError(409, "not-in-progress");
        if (result.error === "empty-guess") throw new HttpError(400, "empty-guess");
        if (result.error === "drawer-cannot-guess") throw new HttpError(403, "drawer-cannot-guess");
        throw new HttpError(422, "unknown-participant");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = getGuesses(code.toUpperCase());

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "not-found");
        throw new HttpError(409, "not-in-progress");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { path } = saveStrokeSchema.parse(request.body);
      const result = saveStroke(code.toUpperCase(), path);

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "not-found");
        throw new HttpError(409, "not-in-progress");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = clearCanvas(code.toUpperCase());

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "not-found");
        throw new HttpError(409, "not-in-progress");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const result = getCanvasStrokes(code.toUpperCase());

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "not-found");
        throw new HttpError(409, "not-in-progress");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "Room not found");
        if (result.error === "not-in-progress") throw new HttpError(409, "Round can only be ended from in-progress state");
        throw new HttpError(403, "Only the host can end the round");
      }

      response.json({ room: toRoomSnapshot(result.room) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartSchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if ("error" in result) {
        if (result.error === "not-found") throw new HttpError(404, "Room not found");
        throw new HttpError(403, "Only the host can restart the game");
      }

      response.json({ room: toRoomSnapshot(result.room) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
