import { Router } from "express";
import {
  clearCanvasSchema,
  createRoomSchema,
  HttpError,
  drawingSubmissionSchema,
  guessSubmissionSchema,
  leaveRoomSchema,
  joinRoomSchema,
  roomSessionResponseSchema,
  roomSnapshotResponseSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema
} from "./schemas.js";
import {
  clearCanvas,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
  submitDrawingStroke,
  submitGuess,
  startRoom,
  toRoomSnapshot
} from "../services/roomStore.js";

function toGameActionError(error: string, action: "drawing" | "guess") {
  if (error === "not_found") {
    return new HttpError(404, "Unable to update room");
  }

  if (error === "not_member") {
    return new HttpError(404, "Unable to update room");
  }

  if (error === "forbidden") {
    return new HttpError(
      403,
      action === "drawing" ? "Only the drawer can update the canvas" : "Only guessers can submit guesses"
    );
  }

  if (error === "not_in_game") {
    return new HttpError(409, "Game has not started yet");
  }

  if (error === "empty_guess") {
    return new HttpError(400, "Guess cannot be empty");
  }

  return new HttpError(409, "You have already solved the word");
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json(
        roomSessionResponseSchema.parse({
          participantId: result.participantId,
          room: toRoomSnapshot(result.room, result.participantId)
        })
      );
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
        throw new HttpError(404, "Unable to join room");
      }

      response.json(
        roomSessionResponseSchema.parse({
          participantId: result.participantId,
          room: toRoomSnapshot(result.room, result.participantId)
        })
      );
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
        throw new HttpError(404, "Unable to load room");
      }

      response.json(roomSnapshotResponseSchema.parse({ room: toRoomSnapshot(room, participantId) }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startRoom(code, participantId);

      if ("error" in result) {
        if (result.error === "not_found") {
          throw new HttpError(404, "Unable to start room");
        }

        if (result.error === "forbidden") {
          throw new HttpError(403, "Only the host can start the game");
        }

        throw new HttpError(409, "At least 2 players are required to start");
      }

      response.json(roomSnapshotResponseSchema.parse({ room: toRoomSnapshot(result.room, participantId) }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, points } = drawingSubmissionSchema.parse(request.body);
      const result = submitDrawingStroke(code, participantId, points);

      if ("error" in result) {
        throw toGameActionError(result.error, "drawing");
      }

      response.json(roomSnapshotResponseSchema.parse({ room: toRoomSnapshot(result.room, participantId) }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/drawing/clear", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearCanvasSchema.parse(request.body);
      const result = clearCanvas(code, participantId);

      if ("error" in result) {
        throw toGameActionError(result.error, "drawing");
      }

      response.json(roomSnapshotResponseSchema.parse({ room: toRoomSnapshot(result.room, participantId) }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = guessSubmissionSchema.parse(request.body);
      const result = submitGuess(code, participantId, guess);

      if ("error" in result) {
        throw toGameActionError(result.error, "guess");
      }

      response.json(roomSnapshotResponseSchema.parse({ room: toRoomSnapshot(result.room, participantId) }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = leaveRoomSchema.parse(request.body);
      const result = leaveRoom(code, participantId);

      if ("error" in result) {
        throw new HttpError(404, "Unable to leave room");
      }

      response.json({
        ok: true,
        deleted: result.deleted
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
