import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import { createRoom, getGuesses, getRoom, joinRoom, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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

  return router;
}
