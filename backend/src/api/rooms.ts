import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, startGame, toRoomSnapshot } from "../services/roomStore.js";

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
      
      let result;
      try {
        result = joinRoom(code.toUpperCase(), playerName);
      } catch (err) {
        if (err instanceof Error && err.message === "Player name already taken in this room") {
          throw new HttpError(400, err.message);
        }
        throw err;
      }

      if (!result) {
        throw new HttpError(404, "Room not found. Please check the code and try again.");
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
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      if (!participantId) {
        throw new HttpError(400, "participantId is required");
      }

      let resultRoom;
      try {
        resultRoom = startGame(code.toUpperCase(), participantId);
      } catch (err) {
        if (err instanceof Error) {
          if (err.message === "Only the host can start the game") {
            throw new HttpError(403, err.message);
          }
          if (err.message === "Cannot start game: at least 2 players are required") {
            throw new HttpError(400, err.message);
          }
        }
        throw err;
      }

      if (!resultRoom) {
        throw new HttpError(404, "Room not found");
      }

      response.json({
        room: toRoomSnapshot(resultRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
