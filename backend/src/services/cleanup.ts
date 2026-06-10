import { getRooms, deleteRoom } from "./roomStore.js";

const CLEANUP_INTERVAL_MS = 60_000;
const ROOM_IDLE_MS = 5 * 60 * 1000;

export function startCleanup() {
  setInterval(() => {
    const now = Date.now();
    const rooms = getRooms();

    for (const [code, room] of rooms) {
      const updatedAt = new Date(room.updatedAt).getTime();
      if (now - updatedAt >= ROOM_IDLE_MS) {
        deleteRoom(code);
      }
    }
  }, CLEANUP_INTERVAL_MS);
}
