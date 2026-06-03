import { Router } from "express";
import {
  appendStrokeSchema,
  clearStrokesSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  restartRoomSchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  appendStroke,
  clearStrokes,
  createRoom,
  DrawNotDrawerError,
  DrawerCannotGuessError,
  getRoom,
  GuessLimitError,
  GuessValidationError,
  joinRoom,
  PlayerNameValidationError,
  restartRoom,
  RestartInvalidStateError,
  RestartNotHostError,
  RoomCapacityError,
  RoundNotActiveError,
  startRound,
  StartInsufficientPlayersError,
  StartInvalidStateError,
  StartNotHostError,
  StrokeLimitError,
  StrokePointsLimitError,
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
      const { participantId } = startRoomSchema.parse(request.body);
      const room = startRound(code.toUpperCase(), participantId);

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

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const body = appendStrokeSchema.parse(request.body);
      const room = appendStroke(code.toUpperCase(), body.participantId, {
        points: body.points,
        color: body.color,
        width: body.width
      });

      if (!room) {
        throw new HttpError(404, "Unable to update room");
      }

      response.json({
        room: toRoomSnapshot(room, body.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/strokes/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearStrokesSchema.parse(request.body);
      const room = clearStrokes(code.toUpperCase(), participantId);

      if (!room) {
        throw new HttpError(404, "Unable to update room");
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
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const room = submitGuess(code.toUpperCase(), participantId, text);

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

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const room = restartRoom(code.toUpperCase(), participantId);

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

export function mapRoomStoreError(error: unknown) {
  if (error instanceof PlayerNameValidationError) {
    return new HttpError(400, error.message);
  }

  if (error instanceof RoomCapacityError) {
    return new HttpError(409, error.message);
  }

  if (error instanceof StartNotHostError) {
    return new HttpError(403, error.message);
  }

  if (error instanceof StartInvalidStateError || error instanceof StartInsufficientPlayersError) {
    return new HttpError(409, error.message);
  }

  if (error instanceof DrawNotDrawerError || error instanceof DrawerCannotGuessError) {
    return new HttpError(403, error.message);
  }

  if (
    error instanceof GuessValidationError
  ) {
    return new HttpError(400, error.message);
  }

  if (
    error instanceof RoundNotActiveError ||
    error instanceof StrokeLimitError ||
    error instanceof GuessLimitError ||
    error instanceof StrokePointsLimitError ||
    error instanceof RestartInvalidStateError
  ) {
    return new HttpError(409, error.message);
  }

  if (error instanceof RestartNotHostError) {
    return new HttpError(403, error.message);
  }

  return error;
}
