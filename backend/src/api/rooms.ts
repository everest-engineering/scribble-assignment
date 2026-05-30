import { Router } from "express";
import {
  createRoomSchema,
  endRoundSchema,
  HttpError,
  joinRoomSchema,
  restartGameSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import { createRoom, endRound, getRoom, joinRoom, restartGame, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if (result === null) {
        throw new HttpError(404, "Room not found");
      }
      if (result === "not-host") {
        throw new HttpError(403, "Only the host can start the game");
      }
      if (result === "not-enough-players") {
        throw new HttpError(422, "Need at least 2 players to start");
      }

      response.json({ room: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if (result === "room-not-found") {
        throw new HttpError(404, "Room not found");
      }
      if (result === "not-playing") {
        throw new HttpError(422, "Game is not in progress");
      }
      if (result === "participant-not-found") {
        throw new HttpError(404, "Participant not found");
      }
      if (result === "is-drawer") {
        throw new HttpError(403, "Drawer cannot submit a guess");
      }

      response.json({ room: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

      if (result === null) {
        throw new HttpError(404, "Room not found");
      }
      if (result === "not-host") {
        throw new HttpError(403, "Only the host can end the round");
      }
      if (result === "not-playing") {
        throw new HttpError(422, "Game is not in progress");
      }

      response.json({ room: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartGameSchema.parse(request.body);
      const result = restartGame(code.toUpperCase(), participantId);

      if (result === null) {
        throw new HttpError(404, "Room not found");
      }
      if (result === "not-host") {
        throw new HttpError(403, "Only the host can restart the game");
      }
      if (result === "not-finished") {
        throw new HttpError(422, "Round has not finished yet");
      }

      response.json({ room: result });
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
