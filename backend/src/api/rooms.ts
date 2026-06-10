import { Router } from "express";
import {
  canvasUpdateSchema,
  createRoomSchema,
  guessSubmitSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, restartRoom, startRoom, submitGuess, toRoomSnapshot, updateCanvas } from "../services/roomStore.js";

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
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startRoom(code.toUpperCase(), participantId);

      if (!result) {
        throw new HttpError(404, "Room not found");
      }

      if ("error" in result) {
        throw new HttpError(403, result.error ?? "Unauthorized");
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { strokes } = canvasUpdateSchema.parse(request.body);
      const room = updateCanvas(code.toUpperCase(), strokes);

      if (!room) {
        throw new HttpError(404, "Room not found");
      }

      response.json({ room: toRoomSnapshot(room) });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guessText } = guessSubmitSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, guessText);

      if (!result) {
        throw new HttpError(404, "Room not found");
      }

      if ("error" in result) {
        throw new HttpError(400, result.error ?? "Invalid guess");
      }

      response.json({
        correct: result.correct,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const result = restartRoom(code.toUpperCase(), participantId);

      if (!result) {
        throw new HttpError(404, "Room not found");
      }

      if ("error" in result) {
        throw new HttpError(403, result.error ?? "Unauthorized");
      }

      response.json({ room: toRoomSnapshot(result.room, participantId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
