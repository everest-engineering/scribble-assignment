import { Router } from "express";
import {
  createRoomSchema,
  endRoundBodySchema,
  HttpError,
  joinRoomSchema,
  restartRoomBodySchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomBodySchema,
  submitGuessSchema
} from "./schemas.js";
import { createRoom, endRound, getRoom, joinRoom, restartRoom, startRoom, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

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
      const { participantId } = startRoomBodySchema.parse(request.body);
      const result = startRoom(code.toUpperCase(), participantId);

      if ("error" in result) {
        if (result.error === "not_found") throw new HttpError(404, "Room not found");
        if (result.error === "forbidden") throw new HttpError(403, "Only the host can start the game");
        if (result.error === "not_enough_players") throw new HttpError(409, "At least 2 players are required to start the game");
      }

      response.json({ room: (result as { room: ReturnType<typeof toRoomSnapshot> }).room });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { guesserId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), guesserId, text);

      if ("error" in result) {
        if (result.error === "not_found") throw new HttpError(404, "Room not found");
        throw new HttpError(409, "Game is not active");
      }

      response.status(201).json({ guess: result.guess });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundBodySchema.parse(request.body);
      const result = endRound(code.toUpperCase(), participantId);

      if ("error" in result) {
        if (result.error === "not_found") throw new HttpError(404, "Room not found");
        if (result.error === "forbidden") throw new HttpError(403, "Only the host can end the round");
        throw new HttpError(409, "Round is not active");
      }

      response.json({ room: result.room });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomBodySchema.parse(request.body);
      const result = restartRoom(code.toUpperCase(), participantId);

      if ("error" in result) {
        if (result.error === "not_found") throw new HttpError(404, "Room not found");
        if (result.error === "forbidden") throw new HttpError(403, "Only the host can restart the game");
        throw new HttpError(409, "Round is not ended");
      }

      response.json({ room: result.room });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
