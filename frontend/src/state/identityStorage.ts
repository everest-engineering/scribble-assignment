export interface LocalIdentity {
  participantId: string;
  role: "host" | "guest";
}

function storageKey(roomCode: string) {
  return `scribble:identity:${roomCode}`;
}

export function readIdentity(roomCode: string): LocalIdentity | null {
  try {
    const raw = window.localStorage.getItem(storageKey(roomCode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalIdentity>;
    if (typeof parsed.participantId !== "string") return null;
    if (parsed.role !== "host" && parsed.role !== "guest") return null;
    return { participantId: parsed.participantId, role: parsed.role };
  } catch {
    return null;
  }
}

export function writeIdentity(roomCode: string, identity: LocalIdentity): void {
  try {
    window.localStorage.setItem(storageKey(roomCode), JSON.stringify(identity));
  } catch {
    // Storage unavailable (private mode, quota, locked-down browser).
    // Spec §Assumptions: degrade to in-memory only; host loses status on refresh.
  }
}

export function clearIdentity(roomCode: string): void {
  try {
    window.localStorage.removeItem(storageKey(roomCode));
  } catch {
    // Same fallback as writeIdentity.
  }
}

const ACTIVE_ROOM_KEY = "scribble:active-room";

export function readActiveRoom(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_ROOM_KEY);
  } catch {
    return null;
  }
}

export function writeActiveRoom(roomCode: string): void {
  try {
    window.localStorage.setItem(ACTIVE_ROOM_KEY, roomCode);
  } catch {
    // Storage unavailable; LobbyPage will fall back to a "/" redirect on refresh.
  }
}

export function clearActiveRoom(): void {
  try {
    window.localStorage.removeItem(ACTIVE_ROOM_KEY);
  } catch {
    // No-op.
  }
}
