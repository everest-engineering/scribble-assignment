export type RoomErrorCode =
  | "INVALID_NAME"
  | "ROOM_CODE_REQUIRED"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "GAME_STARTED"
  | "NOT_HOST"
  | "NOT_ENOUGH_PLAYERS"
  | "NOT_LOBBY"
  | "PARTICIPANT_NOT_FOUND"
  | "NOT_DRAWING"
  | "NOT_DRAWER"
  | "DRAWER_CANNOT_GUESS"
  | "EMPTY_GUESS"
  | "ROUND_ENDED"
  | "NOT_RESULT";

export class RoomServiceError extends Error {
  readonly code: RoomErrorCode;

  constructor(code: RoomErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "RoomServiceError";
  }
}
