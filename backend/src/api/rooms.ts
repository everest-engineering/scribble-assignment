import { Router } from "express";
import { randomUUID } from "node:crypto";
import {
  addStrokeSchema,
  clearCanvasSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addStroke,
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  startGame,
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
      const result = joinRoom(code.toUpperCase(), playerName);

      if ("error" in result) {
        if (result.error === "not_found") {
          throw new HttpError(404, "Unable to join room");
        }

        throw new HttpError(400, "Game has already started");
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

      if ("error" in result) {
        if (result.error === "not_found") {
          throw new HttpError(404, "Unable to load room");
        }

        if (result.error === "not_host") {
          throw new HttpError(403, "Only the host can start the game");
        }

        if (result.error === "not_enough_players") {
          throw new HttpError(400, "At least two players are required");
        }

        throw new HttpError(400, "Game has already started");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, stroke } = addStrokeSchema.parse(request.body);
      const result = addStroke(code.toUpperCase(), participantId, {
        ...stroke,
        id: stroke.id ?? randomUUID()
      });

      if ("error" in result) {
        if (result.error === "not_found") {
          throw new HttpError(404, "Unable to load room");
        }

        if (result.error === "not_playing") {
          throw new HttpError(400, "Game is not active");
        }

        throw new HttpError(403, "Only the drawer can draw");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearCanvas(code.toUpperCase(), participantId);

      if ("error" in result) {
        if (result.error === "not_found") {
          throw new HttpError(404, "Unable to load room");
        }

        if (result.error === "not_playing") {
          throw new HttpError(400, "Game is not active");
        }

        throw new HttpError(403, "Only the drawer can draw");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
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
        if (result.error === "not_found") {
          throw new HttpError(404, "Unable to load room");
        }

        if (result.error === "not_playing") {
          throw new HttpError(400, "Game is not active");
        }

        if (result.error === "is_drawer") {
          throw new HttpError(403, "Drawer cannot guess");
        }

        throw new HttpError(400, "Unable to submit guess");
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

  return router;
}
