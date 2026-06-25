import { useEffect } from "react";
import { useRoomStore } from "../state/roomStore";

export function useRoomPolling(intervalMs: number, enabled = true) {
  const roomStore = useRoomStore();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const poll = () => {
      void roomStore.fetchRoom().catch(() => undefined);
    };

    poll();
    const timerId = window.setInterval(poll, intervalMs);

    return () => {
      window.clearInterval(timerId);
    };
  }, [enabled, intervalMs, roomStore]);
}
