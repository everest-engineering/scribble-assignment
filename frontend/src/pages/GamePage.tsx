import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Keep the game view in sync via the same ~2s polling used by the lobby.
  useEffect(() => {
    roomStore.startPolling(2000);
    return () => roomStore.stopPolling();
  }, [roomStore]);

  // If the round is not active (e.g., not started yet, or reset in a later
  // scenario), fall back to the lobby.
  useEffect(() => {
    if (room && room.status === "lobby") {
      navigate("/lobby", { replace: true });
    }
  }, [navigate, room?.status]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const roleLabel = room.isDrawer ? "Drawer" : "Guesser";

  async function handleGuess(text: string) {
    await roomStore.submitGuess(text);
  }

  function handleDrawingPush(drawing: string | null) {
    void roomStore.updateDrawing(drawing);
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard scores={room.scores} />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title={room.isDrawer ? "Your word to draw" : "Canvas"}>
            {room.isDrawer ? (
              <p className="status-line" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                Secret word: <strong>{room.secretWord}</strong>
              </p>
            ) : (
              <p style={{ marginBottom: '8px' }}>
                {drawer?.name ?? "The drawer"} is drawing — guess the word!
              </p>
            )}
            <DrawingCanvas
              isDrawer={room.isDrawer}
              drawing={room.drawing}
              onPush={handleDrawingPush}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Your role</dt>
                <dd>{roleLabel}{room.isDrawer ? " (you are drawing)" : ""}</dd>
              </div>
              <div>
                <dt>Drawer</dt>
                <dd>{drawer?.name ?? "Unassigned"}</dd>
              </div>
            </dl>
          </Card>

          {room.isDrawer ? (
            <Card title="Your Guess">
              <p>You are the drawer — guessers submit the guesses.</p>
            </Card>
          ) : (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuess} />
            </Card>
          )}

          <Card title="Guesses">
            {room.guesses.length === 0 ? (
              <p>No guesses yet.</p>
            ) : (
              <ul className="player-list">
                {room.guesses.map((guess) => (
                  <li key={guess.id}>
                    <span>
                      <strong>{guess.participantName}:</strong>{" "}
                      {guess.correct && guess.text === null ? "•••" : guess.text}
                    </span>
                    <span className="player-list__meta">
                      {guess.correct ? "✓ correct" : "✗"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
