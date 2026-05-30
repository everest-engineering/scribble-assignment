import { Router } from "express";
import {
  createRoomSchema,
  disbandBodySchema,
  HttpError,
  joinRoomSchema,
  renameBodySchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameBodySchema
} from "./schemas.js";
import {
  checkCreateRateLimit,
  checkJoinRateLimit,
  createRoom,
  disbandRoom,
  getRoom,
  getRoomStatus,
  joinRoom,
  recordCreateAttempt,
  recordJoinAttempt,
  renameParticipant,
  startGame,
  toRoomSnapshot
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const sessionKey = request.ip ?? "anonymous";
      if (!checkCreateRateLimit(sessionKey)) {
        throw new HttpError(429, "Too many rooms created. Please wait before creating another.");
      }

      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);
      recordCreateAttempt(sessionKey);

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
      const sessionKey = request.ip ?? "anonymous";
      if (!checkJoinRateLimit(sessionKey)) {
        throw new HttpError(429, "Too many join attempts. Please wait before trying again.");
      }

      const { code } = roomCodeParamsSchema.parse(request.params);
      const upperCode = code.toUpperCase();
      const status = getRoomStatus(upperCode);

      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(upperCode, playerName);

      if (!result) {
        throw new HttpError(404, "Unable to join room");
      }

      recordJoinAttempt(sessionKey);

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
      const { participantId } = startGameBodySchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if ("error" in result) {
        const message = result.error as string;
        const statusCode = message === "Room not found" ? 404
          : message === "Participant not found in room" ? 403
          : message === "Only the host can start the game" ? 403
          : 400;
        throw new HttpError(statusCode, message);
      }

      if ("awaitingRename" in result) {
        response.json({
          status: "awaiting_rename",
          invalidParticipantIds: result.invalidParticipantIds,
          room: toRoomSnapshot(result.room, participantId)
        });
        return;
      }

      response.json({
        status: "playing",
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/rename", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, name } = renameBodySchema.parse(request.body);
      const result = renameParticipant(code.toUpperCase(), participantId, name);

      if ("error" in result) {
        const message = result.error as string;
        const statusCode = message === "Room not found" ? 404
          : message === "Participant not found" ? 403
          : message === "Room is not in awaiting_rename state" ? 400
          : 400;
        throw new HttpError(statusCode, message);
      }

      if ("autoStarted" in result) {
        response.json({
          status: "playing",
          room: toRoomSnapshot(result.room, participantId)
        });
        return;
      }

      response.json({
        status: "awaiting_rename",
        invalidParticipantIds: result.invalidParticipantIds,
        room: toRoomSnapshot(result.room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/disband", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = disbandBodySchema.parse(request.body);
      const result = disbandRoom(code.toUpperCase(), participantId);

      if ("error" in result) {
        const message = result.error as string;
        const statusCode = message === "Room not found" ? 404
          : message === "Participant not found" ? 403
          : 403;
        throw new HttpError(statusCode, message);
      }

      response.json({ message: "Room disbanded" });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
