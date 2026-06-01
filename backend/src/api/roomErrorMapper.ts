import { HttpError } from "./schemas.js";
import { RoomServiceError } from "../services/roomErrors.js";

export function mapRoomServiceError(error: RoomServiceError): HttpError {
  switch (error.code) {
    case "INVALID_NAME":
      return new HttpError(400, error.message);
    case "ROOM_CODE_REQUIRED":
      return new HttpError(400, error.message);
    case "ROOM_NOT_FOUND":
    case "PARTICIPANT_NOT_FOUND":
      return new HttpError(404, error.message);
    case "ROOM_FULL":
    case "GAME_STARTED":
    case "NOT_LOBBY":
      return new HttpError(409, error.message);
    case "NOT_HOST":
      return new HttpError(403, error.message);
    case "NOT_ENOUGH_PLAYERS":
      return new HttpError(400, error.message);
    default:
      return new HttpError(500, error.message);
  }
}
