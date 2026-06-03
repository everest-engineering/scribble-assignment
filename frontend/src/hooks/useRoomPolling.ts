import { useEffect, useRef } from "react";

const POLL_INTERVAL_MS = 2000;

export function useRoomPolling(onPoll: () => void | Promise<void>, enabled = true) {
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;

    function tick() {
      if (document.visibilityState !== "visible") {
        return;
      }

      void onPollRef.current();
    }

    intervalId = setInterval(tick, POLL_INTERVAL_MS);
    tick();

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        tick();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled]);
}
