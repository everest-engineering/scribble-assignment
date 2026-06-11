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
  submitGuessSchema
} from "./schemas.js";
import {
  createRoom,
  endRound,
  getRoom,
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
      const room = getRoom(code);

      if (!room) {
        throw new HttpError(404, "Room not found");
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
      const { participantId } = startRoomSchema.parse(request.body);
      const outcome = startRoom(code, participantId);

      if (!outcome.ok) {
        if (outcome.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (outcome.reason === "not_host") {
          throw new HttpError(403, "Only the host can start the game");
        }
        throw new HttpError(409, "Need at least 2 players to start");
      }

      response.json({
        room: toRoomSnapshot(outcome.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const outcome = submitGuess(code, participantId, text);

      if (!outcome.ok) {
        if (outcome.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (outcome.reason === "no_round") {
          throw new HttpError(409, "No round in progress");
        }
        if (outcome.reason === "not_in_room") {
          throw new HttpError(403, "Participant is not in the room");
        }
        if (outcome.reason === "is_drawer") {
          throw new HttpError(403, "Drawers cannot guess in their own round");
        }
        throw new HttpError(409, "You have already guessed correctly this round");
      }

      response.json({
        room: toRoomSnapshot(outcome.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/end", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = endRoundSchema.parse(request.body);
      const outcome = endRound(code, participantId);

      if (!outcome.ok) {
        if (outcome.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (outcome.reason === "not_host") {
          throw new HttpError(403, "Only the host can end the round");
        }
        throw new HttpError(409, "No active round to end");
      }

      response.json({
        room: toRoomSnapshot(outcome.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const outcome = restartRoom(code, participantId);

      if (!outcome.ok) {
        if (outcome.reason === "not_found") {
          throw new HttpError(404, "Room not found");
        }
        if (outcome.reason === "not_host") {
          throw new HttpError(403, "Only the host can restart the room");
        }
        throw new HttpError(409, "End the active round before restarting");
      }

      response.json({
        room: toRoomSnapshot(outcome.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
