import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingSurface } from "../components/DrawingSurface";
import { GuessForm } from "../components/GuessForm";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import type { DrawingPoint } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [restartError, setRestartError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    if (room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room || room.status === "lobby") {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void roomStore
        .fetchRoom()
        .then(() => {
          setRefreshError(null);
        })
        .catch((caughtError) => {
          setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
        });
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [room?.code, room?.status, roomStore]);

  async function handleRefresh() {
    try {
      setRefreshError(null);
      await roomStore.fetchRoom();
    } catch (caughtError) {
      setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh room");
    }
  }

  async function handleSubmitStroke(points: DrawingPoint[]) {
    await roomStore.drawStroke(points);
  }

  async function handleClearCanvas() {
    await roomStore.clearCanvas();
  }

  async function handleSubmitGuess(guess: string) {
    await roomStore.submitGuess(guess);
  }

  async function handleRestartGame() {
    try {
      setRestartError(null);
      await roomStore.restartGame();
    } catch (caughtError) {
      setRestartError(caughtError instanceof Error ? caughtError.message : "Unable to restart game");
    }
  }

  if (!room) {
    return null;
  }

  const isResults = room.status === "results";
  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer =
    room.participants.find((participant) => participant.id === room.drawerParticipantId) ?? null;
  const wordStatus =
    room.wordVisibility === "visible"
      ? isResults
        ? "Correct word revealed"
        : "Secret word visible"
      : "Secret word hidden";
  const wordValue =
    room.wordVisibility === "visible"
      ? room.secretWord ?? "Unavailable"
      : "Only the drawer can see the word right now.";
  const drawerStatus = room.viewerIsDrawer
    ? isResults
      ? "You were the drawer for this completed round."
      : "You are the drawer for this round."
    : `${drawer?.name ?? "Another player"} ${isResults ? "drew the completed round." : "is drawing this round."}`;
  const history = room.guessHistory ?? [];
  const canvas = room.canvas ?? { strokes: [] };
  const statusMessage = isResults
    ? restartError ??
      refreshError ??
      error ??
      (room.viewerIsHost
        ? "Round complete. Review the results and restart when everyone is ready."
        : "Round complete. Waiting for the host to restart the room.")
    : refreshError ?? error ?? (room.viewerCanDraw ? "Draw something for the guessers." : "Watch the sketch and submit guesses.");

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">{isResults ? "Round complete" : "Round 1"}</span>
          <h1 className="game-page__title">{isResults ? "Round Results" : "Live Gameplay"}</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      {isResults ? (
        <div className="result-banner">
          <p className="status-line status-line--success">Results synchronized</p>
          <p>{room.roundEndedAt ? "The round ended on the first correct accepted guess." : "The completed round is ready for review."}</p>
        </div>
      ) : null}

      <div className="game-page__layout">
        <aside className="game-page__sidebar">
          <Card title="Round Status">
            <p
              className={`status-line ${
                isResults ? "status-line--success" : room.viewerIsDrawer ? "status-line--success" : "status-line--info"
              }`}
            >
              {isResults ? "Result state active" : room.viewerIsDrawer ? "Drawer controls enabled" : "Guesser view active"}
            </p>
            <p>{drawerStatus}</p>
            <p>{statusMessage}</p>
          </Card>

          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{room.viewerIsDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd>{viewer?.score ?? 0} pts</dd>
              </div>
              <div>
                <dt>Host</dt>
                <dd>{room.viewerIsHost ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </Card>
        </aside>

        <div className="game-page__main">
          <Card title="Secret Word">
            <p
              className={`status-line ${
                room.wordVisibility === "visible" ? "status-line--success" : "status-line--muted"
              }`}
            >
              {wordStatus}
            </p>
            <div
              className={`word-panel ${
                room.wordVisibility === "visible" ? "word-panel--visible" : "word-panel--hidden"
              }`}
            >
              <span className="word-panel__label">
                {room.wordVisibility === "visible"
                  ? isResults
                    ? "Completed word"
                    : "Your word"
                  : "Word visibility"}
              </span>
              <strong className="word-panel__value">{wordValue}</strong>
            </div>
          </Card>

          <Card title={isResults ? "Completed Canvas" : "Canvas"}>
            <DrawingSurface
              canvas={canvas}
              canDraw={room.viewerCanDraw}
              isBusy={isLoading}
              onSubmitStroke={handleSubmitStroke}
              onClearCanvas={handleClearCanvas}
            />
          </Card>

          <Card title={isResults ? "Final Guess History" : "Guess History"}>
            {history.length === 0 ? (
              <div className="placeholder-block">
                <p>{isResults ? "No accepted guesses were recorded before the round ended." : "No guesses have been accepted yet."}</p>
              </div>
            ) : (
              <ul className="history-list">
                {history.map((entry) => (
                  <li key={entry.id} className="history-list__item">
                    <div className="history-list__content">
                      <strong>{entry.participantName}</strong>
                      <span>{entry.guess}</span>
                    </div>
                    <div className="history-list__meta">
                      <span
                        className={`status-line ${
                          entry.isCorrect ? "status-line--success" : "status-line--muted"
                        }`}
                      >
                        {entry.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                      <strong>{entry.scoreAwarded} pts</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar">
          <Card title={isResults ? "Final Scores" : "Participants"}>
            <ul className="player-list">
              {room.participants.map((participant) => {
                const labels = [];

                if (participant.id === participantId) {
                  labels.push("you");
                }

                if (participant.id === room.hostParticipantId) {
                  labels.push("host");
                }

                if (participant.id === room.drawerParticipantId) {
                  labels.push("drawer");
                }

                return (
                  <li key={participant.id}>
                    <div className="player-list__player">
                      <span>{participant.name}</span>
                      <span className="player-list__meta">{labels.join(" · ") || "joined"}</span>
                    </div>
                    <strong className={`player-list__score ${isResults ? "player-list__score--final" : ""}`}>
                      {participant.score} pts
                    </strong>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card title={isResults ? "Round Controls" : room.viewerCanGuess ? "Submit Guess" : "Guessing"}>
            {isResults ? (
              <div className="result-actions">
                <p>{room.canRestartGame ? "You can restart the room when everyone is ready." : "Only the host can restart this completed room."}</p>
                <button
                  className="button button--primary"
                  disabled={!room.canRestartGame || isLoading}
                  onClick={handleRestartGame}
                >
                  {room.canRestartGame ? "Restart to Lobby" : "Host Can Restart"}
                </button>
              </div>
            ) : room.viewerCanGuess ? (
              <GuessForm disabled={isLoading} onSubmitGuess={handleSubmitGuess} />
            ) : (
              <div className="placeholder-block">
                <p>{room.viewerCanDraw ? "Guess submission is disabled for the drawer." : "Waiting for gameplay access."}</p>
              </div>
            )}
          </Card>

          <div className="button-row button-row--compact">
            <button className="button button--secondary" disabled={isLoading} onClick={handleRefresh}>
              {isLoading ? "Refreshing..." : "Refresh State"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
