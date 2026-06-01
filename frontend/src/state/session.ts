const SESSION_KEY = "scribble.roomSession";

export interface StoredRoomSession {
  roomCode: string;
  participantId: string;
}

export function saveRoomSession(session: StoredRoomSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadRoomSession(): StoredRoomSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredRoomSession;

    if (parsed.roomCode && parsed.participantId) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function clearRoomSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
