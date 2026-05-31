import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  roomResponseSchema,
  roomCodeParamsSchema,
  roomSessionResponseSchema,
  startGameSchema,
  roomViewerQuerySchema,
  submitGuessSchema
} from "./schemas.js";
import { createRoom, getRoom, joinRoom, startGame, toRoomSnapshot, submitGuess } from "../services/roomStore.js";

function parseRoomCode(params: unknown) {
  const parsed = roomCodeParamsSchema.safeParse(params);

  if (!parsed.success) {
    throw new HttpError(400, "Room code is required.", "ROOM_CODE_REQUIRED");
  }

  return parsed.data.code;
}

function validateSessionResponse(payload: unknown) {
  return roomSessionResponseSchema.parse(payload);
}

function validateRoomResponse(payload: unknown) {
  return roomResponseSchema.parse(payload);
}

function startGameError(reason: Exclude<ReturnType<typeof startGame>, { ok: true }>["reason"]) {
  switch (reason) {
    case "room-not-found":
      return new HttpError(404, "Room could not be found or joined.", "ROOM_NOT_FOUND");
    case "participant-not-host":
      return new HttpError(403, "Only the host can start the game.", "START_REQUIRES_HOST");
    case "not-enough-players":
      return new HttpError(400, "At least two players are required to start.", "START_REQUIRES_TWO_PLAYERS");
    case "room-already-started":
      return new HttpError(409, "Room is no longer in lobby state.", "ROOM_ALREADY_STARTED");
  }
}

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json(validateSessionResponse({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const code = parseRoomCode(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code, playerName);

      if (!result) {
        throw new HttpError(404, "Room could not be found or joined.", "ROOM_NOT_FOUND");
      }

      response.json(validateSessionResponse({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const code = parseRoomCode(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code);

      if (!room) {
        throw new HttpError(404, "Room could not be found or joined.", "ROOM_NOT_FOUND");
      }

      response.json(validateRoomResponse({
        room: toRoomSnapshot(room, participantId)
      }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const code = parseRoomCode(request.params);
      const body = startGameSchema.safeParse(request.body);

      if (!body.success) {
        throw new HttpError(400, "Participant id is required.", "PARTICIPANT_REQUIRED");
      }

      const result = startGame(code, body.data.participantId);

      if (!result.ok) {
        throw startGameError(result.reason);
      }

      response.json(validateRoomResponse({
        room: toRoomSnapshot(result.room, body.data.participantId)
      }));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const code = parseRoomCode(request.params);
      const body = submitGuessSchema.safeParse(request.body);

      if (!body.success) {
        const firstIssue = body.error.issues[0];
        const msg = firstIssue ? firstIssue.message : "Invalid request body.";
        throw new HttpError(400, msg, "INVALID_REQUEST");
      }

      const { participantId, guessText } = body.data;
      const updatedRoom = submitGuess(code, participantId, guessText);

      response.json(validateRoomResponse({
        room: toRoomSnapshot(updatedRoom, participantId)
      }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
