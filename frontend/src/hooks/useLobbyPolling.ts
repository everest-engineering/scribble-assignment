import { useEffect } from "react";
import { useRoomStore } from "../state/roomStore";

const DEFAULT_INTERVAL_MS = 2000;

export function useLobbyPolling(
  code: string | null,
  participantId: string | null,
  intervalMs: number = DEFAULT_INTERVAL_MS
) {
  const store = useRoomStore();

  useEffect(() => {
    if (!code || !participantId) return undefined;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (cancelled) return;
      void store.fetchRoom();
    };

    const startInterval = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(tick, intervalMs);
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") {
        tick();
        startInterval();
      } else {
        stopInterval();
      }
    };

    // Immediate fetch on mount.
    tick();

    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      startInterval();
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      stopInterval();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
  }, [code, participantId, intervalMs, store]);
}
