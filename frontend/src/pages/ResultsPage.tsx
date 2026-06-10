import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { ResultsView } from "../components/ResultsView";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;
const ERROR_TOAST_DURATION_MS = 5000;

export function ResultsPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, isLoading } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHost = participantId !== null && room !== null && participantId === room.hostId;

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  const showError = useCallback((message: string) => {
    setErrorToast(message);
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
    }
    errorTimerRef.current = setTimeout(() => {
      setErrorToast(null);
    }, ERROR_TOAST_DURATION_MS);
  }, []);

  const doPoll = useCallback(async () => {
    try {
      const updatedRoom = await roomStore.fetchRoom();
      if (updatedRoom && updatedRoom.status === "lobby") {
        navigate("/lobby");
      }
      if (updatedRoom && updatedRoom.status === "playing") {
        navigate("/game");
      }
    } catch {
      showError("Connection lost");
    }
  }, [navigate, roomStore, showError]);

  useEffect(() => {
    doPoll();
    pollingRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, [doPoll]);

  const handleRestart = useCallback(async () => {
    try {
      await roomStore.restartRoom();
      navigate("/lobby");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to restart");
    }
  }, [navigate, roomStore, showError]);

  if (!room) {
    return null;
  }

  const drawer = room.participants.find((p) => p.id === room.drawerId);

  return (
    <section className="panel results-page">
      <div className="results-page__header">
        <h1 className="results-page__title">Round Complete</h1>
      </div>

      {isLoading && (
        <Card title="Loading">
          <p>Loading results...</p>
        </Card>
      )}

      {!isLoading && (
        <ResultsView
          secretWord={room.secretWord ?? ""}
          drawerName={drawer?.name ?? "Unknown"}
          participants={room.participants}
          scores={room.scores}
          guessHistory={room.guessHistory}
        />
      )}

      {errorToast && (
        <div className="toast toast--error">
          {errorToast}
        </div>
      )}

      <div className="button-row">
        {isHost ? (
          <button className="button button--primary" disabled={isLoading} onClick={handleRestart}>
            Restart Game
          </button>
        ) : (
          <p className="results-page__waiting">Waiting for the host to restart...</p>
        )}
        <button className="button button--secondary" disabled={isLoading} onClick={() => navigate("/lobby")}>
          Back to Lobby
        </button>
      </div>
    </section>
  );
}
