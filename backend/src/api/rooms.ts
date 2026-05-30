import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  submitGuessSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  saveCanvasSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, startGame, submitGuess, toRoomSnapshot, saveCanvas, restartGame } from "../services/roomStore.js";

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
      const { participantId } = roomViewerQuerySchema.parse(request.query);

      const room = startGame(
        code.toUpperCase(),
        participantId
      );

      if (!room) {
        throw new HttpError(404, "Unable to start game");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId } = roomViewerQuerySchema.parse(request.query);
    const { message } = submitGuessSchema.parse(request.body);

    if (!participantId) {
      throw new HttpError(400, "participantId is required");
    }

    const room = submitGuess(
      code.toUpperCase(),
      participantId,
      message
    );

    if (!room) {
      throw new HttpError(404, "Unable to submit guess");
    }

    response.json({
      room: toRoomSnapshot(room, participantId)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:code/canvas", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId } = roomViewerQuerySchema.parse(request.query);
    const { lines } = saveCanvasSchema.parse(request.body);

    if (!participantId) {
      throw new HttpError(400, "participantId is required");
    }

    const room = saveCanvas(
      code.toUpperCase(),
      participantId,
      lines
    );

    if (!room) {
      throw new HttpError(404, "Unable to save canvas");
    }

    response.json({
      room: toRoomSnapshot(room, participantId)
    });
  } catch (error) {
    next(error);
  }
});

  router.post("/:code/restart", (request, response, next) => {
  try {
    const { code } = roomCodeParamsSchema.parse(request.params);
    const { participantId } = roomViewerQuerySchema.parse(request.query);

    const room = restartGame(code.toUpperCase(), participantId);

    if (!room) {
      throw new HttpError(404, "Unable to restart game");
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

