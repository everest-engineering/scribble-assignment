const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`);

export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase();
}

export type RoomCodeValidationResult =
  | { ok: true; code: string }
  | { ok: false; message: string };

export function validateRoomCode(rawCode: string): RoomCodeValidationResult {
  const code = normalizeRoomCode(rawCode);

  if (!code) {
    return { ok: false, message: "Room code is required" };
  }

  if (!ROOM_CODE_PATTERN.test(code)) {
    return {
      ok: false,
      message: "Room code must be 4 characters (A–Z, 2–9; no I, O, 0, 1)"
    };
  }

  return { ok: true, code };
}
