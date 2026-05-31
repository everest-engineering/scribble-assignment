const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ROOM_CODE_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{4}$`);

export function validateRoomCode(raw: string): { ok: true; code: string } | { ok: false; message: string } {
  const code = raw.trim().toUpperCase();

  if (!ROOM_CODE_PATTERN.test(code)) {
    return { ok: false, message: "Room code must be 4 characters (A-Z, 2-9, no I/O/0/1)" };
  }

  return { ok: true, code };
}
