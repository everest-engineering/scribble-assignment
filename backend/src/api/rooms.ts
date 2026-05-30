import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  participantActionSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  submitGuessSchema,
  updateDrawingSchema
} from "./schemas.js";
import {
  clearDrawing,
  createRoom,
  getRoom,
  joinRoom,
  restartGame,
  startGame,
  submitGuess,
  toRoomSnapshot,
  updateDrawing
} from "../services/roomStore.js";

function requireRoom(code: string) {
  const room = getRoom(code.toUpperCase());

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  return room;
}

function throwRoomActionError(reason: string): never {
  if (reason === "not-found") {
    throw new HttpError(404, "Room not found");
  }

  if (reason === "not-host") {
    throw new HttpError(403, "Only the host can perform this action");
  }

  if (reason === "not-drawer") {
    throw new HttpError(403, "Only the drawer can update the drawing");
  }

  if (reason === "drawer-cannot-guess") {
    throw new HttpError(403, "The drawer cannot submit guesses");
  }

  if (reason === "unknown-participant") {
    throw new HttpError(404, "Participant not found in room");
  }

  if (reason === "not-enough-players") {
    throw new HttpError(409, "At least two players are required to start");
  }

  if (reason === "not-playing") {
    throw new HttpError(409, "Room is not currently playing");
  }

  if (reason === "not-results") {
    throw new HttpError(409, "Room is not ready to restart");
  }

  throw new HttpError(400, "Unable to perform room action");
}

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

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = requireRoom(code);

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
      const { participantId } = participantActionSchema.parse(request.body);
      const result = startGame(code, participantId);

      if (!result.ok) {
        throwRoomActionError(result.reason);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.put("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, drawing } = updateDrawingSchema.parse(request.body);
      const result = updateDrawing(code, participantId, drawing);

      if (!result.ok) {
        throwRoomActionError(result.reason);
      }

      response.json({
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = participantActionSchema.parse(request.body);
      const result = clearDrawing(code, participantId);

      if (!result.ok) {
        throwRoomActionError(result.reason);
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
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code, participantId, text);

      if (!result.ok) {
        throwRoomActionError(result.reason);
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
      const { participantId } = participantActionSchema.parse(request.body);
      const result = restartGame(code, participantId);

      if (!result.ok) {
        throwRoomActionError(result.reason);
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
