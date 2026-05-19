import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  createRoom,
  getRoom,
  isAuthorizedParticipant,
  joinRoom,
  restartRoom,
  startRoom,
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
        sessionId: result.sessionId,
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

      if (!result.ok) {
        if (result.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }

        throw new HttpError(409, "Game already started");
      }

      response.json({
        participantId: result.participantId,
        sessionId: result.sessionId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, sessionId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      if (!participantId || !sessionId || !isAuthorizedParticipant(room, participantId, sessionId)) {
        throw new HttpError(403, "Room access denied");
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
      const { participantId, sessionId } = startRoomSchema.parse(request.body);
      const result = startRoom(code, participantId, sessionId);

      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw new HttpError(404, "Room not found");
          case "already_started":
            throw new HttpError(409, "Game already started");
          case "not_host":
            throw new HttpError(403, "Only the host can start the game");
          case "not_enough_players":
            throw new HttpError(422, "At least 2 players are required");
        }
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, sessionId, guessText } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code, participantId, sessionId, guessText);

      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw new HttpError(404, "Room not found");
          case "not_allowed":
            throw new HttpError(403, "Only active guessers can submit guesses");
          case "not_playing":
            throw new HttpError(409, "Room is not accepting guesses");
          case "invalid_guess":
            throw new HttpError(422, "Enter a guess");
        }
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
      const { participantId, sessionId } = restartRoomSchema.parse(request.body);
      const result = restartRoom(code, participantId, sessionId);

      if (!result.ok) {
        switch (result.reason) {
          case "not_found":
            throw new HttpError(404, "Room not found");
          case "not_host":
            throw new HttpError(403, "Only the host can restart the room");
          case "not_result":
            throw new HttpError(409, "Room is not ready to restart");
        }
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
