import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitDrawingSchema,
  submitGuessSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, toRoomSnapshot, recordParticipantActivity, startGame } from "../services/roomStore.js";
import { handleDrawingAction } from "../services/drawingService.js";
import { handleGuess } from "../services/guessService.js";
import { endRound, restartGame } from "../services/roomStore.js";

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
      if (error instanceof Error && (error.message === "Room is full" || error.message === "Name is already taken")) {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      
      if (participantId) {
        recordParticipantActivity(code.toUpperCase(), participantId);
      }

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
      
      const room = startGame(code.toUpperCase(), participantId);
      
      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && (
        error.message === "Room not found" ||
        error.message === "Cannot start game with fewer than 2 players" ||
        error.message === "Only the host can start the game" ||
        error.message === "Game has already started"
      )) {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/drawing", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, action } = submitDrawingSchema.parse(request.body);
      
      const room = handleDrawingAction(code.toUpperCase(), participantId, action as any);
      
      if (!room) {
        throw new HttpError(404, "Room not found after save");
      }
      
      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Drawer")) {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const payload = submitGuessSchema.parse(request.body);
      
      const room = handleGuess(code.toUpperCase(), payload.participantId, payload);
      
      if (!room) {
        throw new HttpError(404, "Room not found after save");
      }
      
      response.json({
        room: toRoomSnapshot(room, payload.participantId)
      });
    } catch (error) {
      if (error instanceof Error && (
        error.message === "Cannot guess when not playing" ||
        error.message === "Drawer cannot guess" ||
        error.message === "Participant not found"
      )) {
        next(new HttpError(400, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const participantId = request.headers["x-player-id"] as string;
      
      const room = restartGame(code.toUpperCase(), participantId);
      
      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Only the host")) {
        next(new HttpError(401, error.message));
      } else {
        next(error);
      }
    }
  });

  router.post("/:code/end-round", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const participantId = request.headers["x-player-id"] as string;
      
      // We can optionally verify if it's the host here.
      const room = endRound(code.toUpperCase());
      
      if (!room) {
        throw new HttpError(404, "Room not found or not playing");
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
