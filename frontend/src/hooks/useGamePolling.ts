import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function useGamePolling() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room } = useRoomState();
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    if (!room || room.status !== "playing") {
      return;
    }

    async function poll() {
      try {
        setPollError(null);
        const snapshot = await roomStore.fetchRoomSilent();

        if (snapshot?.status === "results") {
          navigate("/result");
        }
      } catch (caughtError) {
        setPollError(
          caughtError instanceof Error ? caughtError.message : "Unable to refresh game"
        );
      }
    }

    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [navigate, room, room?.code, room?.status, roomStore]);

  return pollError;
}
