import { Router } from "express";
import {
  canvasUpdateSchema,
  createRoomSchema,
  HttpError,
  guessSubmissionSchema,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, restartRoom, startGame, toRoomSnapshot, submitGuess, updateCanvasState } from "../services/roomStore.js";

const ROOM_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/;

function normalizeRoomCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  return ROOM_CODE_PATTERN.test(normalizedCode) ? normalizedCode : null;
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const normalizedPlayerName = playerName?.trim() ?? "";

      if (!normalizedPlayerName) {
        throw new HttpError(400, "Please enter a player name.");
      }

      const result = createRoom(normalizedPlayerName);

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
      const normalizedCode = normalizeRoomCode(code);
      const normalizedPlayerName = playerName?.trim() ?? "";

      if (!normalizedCode || !normalizedPlayerName) {
        throw new HttpError(404, "Unable to join room");
      }

      const result = joinRoom(normalizedCode, normalizedPlayerName);

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

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const normalizedCode = normalizeRoomCode(code);

      if (!normalizedCode) {
        throw new HttpError(404, "Unable to load room");
      }

      const room = getRoom(normalizedCode);

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (participantId !== room.hostId) {
        throw new HttpError(403, "Only the host can start the game");
      }

      const startedRoom = startGame(normalizedCode);

      if (!startedRoom) {
        throw new HttpError(400, "Unable to start game");
      }

      response.json({
        room: toRoomSnapshot(startedRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const normalizedCode = normalizeRoomCode(code);

      if (!normalizedCode) {
        throw new HttpError(404, "Unable to load room");
      }

      const room = getRoom(normalizedCode);

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

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const { guess } = guessSubmissionSchema.parse(request.body);
      const normalizedCode = normalizeRoomCode(code);

      if (!normalizedCode || !participantId) {
        throw new HttpError(400, "Invalid request");
      }

      const room = getRoom(normalizedCode);

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      const result = submitGuess(normalizedCode, participantId, guess);

      if (!result.success) {
        throw new HttpError(400, result.error ?? "Unable to submit guess");
      }

      const updatedRoom = getRoom(normalizedCode);

      if (!updatedRoom) {
        throw new HttpError(500, "Unable to retrieve updated room");
      }

      response.json({
        room: toRoomSnapshot(updatedRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/canvas", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const { canvasState } = canvasUpdateSchema.parse(request.body);
      const normalizedCode = normalizeRoomCode(code);

      if (!normalizedCode || !participantId) {
        throw new HttpError(400, "Invalid request");
      }

      const room = getRoom(normalizedCode);

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      if (room.drawerId !== participantId) {
        throw new HttpError(403, "Only the drawer can update the canvas");
      }

      const result = updateCanvasState(normalizedCode, canvasState);

      if (!result.success) {
        throw new HttpError(400, result.error ?? "Unable to update canvas");
      }

      const updatedRoom = getRoom(normalizedCode);

      if (!updatedRoom) {
        throw new HttpError(500, "Unable to retrieve updated room");
      }

      response.json({
        room: toRoomSnapshot(updatedRoom, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const normalizedCode = normalizeRoomCode(code);

      if (!normalizedCode || !participantId) {
        throw new HttpError(400, "Invalid request");
      }

      const result = restartRoom(normalizedCode, participantId);

      if (!result.success) {
        throw new HttpError(result.status ?? 400, result.error ?? "Unable to restart");
      }

      response.json({
        room: toRoomSnapshot(result.room!, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
