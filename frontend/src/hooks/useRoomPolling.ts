import { useEffect } from "react";
import { useRoomStore } from "../state/roomStore";

interface UseRoomPollingOptions {
  enabled: boolean;
  intervalMs?: number;
}

export function useRoomPolling({ enabled, intervalMs = 2000 }: UseRoomPollingOptions) {
  const roomStore = useRoomStore();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom(true);
    }, intervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, intervalMs, roomStore]);
}
