import { cleanupInactiveRooms, getRoomTtlMs } from "./roomStore.js";

let intervalId: NodeJS.Timeout | null = null;

export function startRoomCleanup(intervalMs?: number) {
  const ttl = getRoomTtlMs();
  const interval = intervalMs ?? Math.max(30000, Math.floor(ttl / 10));

  if (intervalId) {
    clearInterval(intervalId);
  }

  intervalId = setInterval(() => {
    try {
      const removed = cleanupInactiveRooms();
      if (removed.length > 0) {
        console.log(
          `[roomCleanup] removed ${removed.length} room(s): ${removed.join(",")}`
        );
      }
    } catch (err) {
      console.error("[roomCleanup] error during cleanup:", err);
    }
  }, interval);

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}
