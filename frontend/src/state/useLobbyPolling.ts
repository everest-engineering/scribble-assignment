import { useEffect } from "react";
import { useRoomStore } from "./roomStore";

export const LOBBY_POLL_INTERVAL_MS = 2000;

export function useLobbyPolling(roomCode: string | null): void {
  const roomStore = useRoomStore();

  useEffect(() => {
    if (!roomCode) return undefined;

    void roomStore.fetchRoom();

    const intervalId = window.setInterval(() => {
      void roomStore.fetchRoom();
    }, LOBBY_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [roomCode, roomStore]);
}
