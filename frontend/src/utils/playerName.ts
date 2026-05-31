export function validatePlayerName(raw: string): { ok: true; name: string } | { ok: false; message: string } {
  const name = raw.trim();

  if (!name) {
    return { ok: false, message: "Player name is required" };
  }

  return { ok: true, name };
}
