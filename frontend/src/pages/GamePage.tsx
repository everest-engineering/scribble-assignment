import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { Canvas } from "../components/Canvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { ResultScreen } from "../components/ResultScreen";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { error: storeError, room, participantId } = useRoomState();
  const [refreshError, setRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  // Setup polling for game state refresh
  useEffect(() => {
    if (!room) {
      return undefined;
    }

    let isMounted = true;
    const interval = window.setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setRefreshError(caughtError instanceof Error ? caughtError.message : "Unable to refresh game state");
      }
    }, 2000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [room, roomStore]);

  async function handleGuessSubmit(guess: string) {
    await roomStore.submitGuess(guess);
  }

  async function handleCanvasDraw(canvasState: string) {
    await roomStore.submitCanvasState(canvasState);
  }

  async function handleRestart() {
    try {
      await roomStore.restartRoom();
    } catch {
      // Error is already set in roomStore state
    }
  }

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isPlaying = room.status === "playing";
  const isFinished = room.status === "finished";

  if (isFinished) {
    return (
      <section className="panel game-page">
        <RoomCodeBadge code={room.code} />
        <ResultScreen room={room} participantId={participantId} onRestart={handleRestart} />
        {storeError && <p style={{ color: '#dc2626', padding: '8px' }}>{storeError}</p>}
      </section>
    );
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
          <Scoreboard />
          <Card title="Guess History">
            {room.guessHistory.length === 0 ? (
              <p>No guesses yet.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {room.guessHistory.map((guess) => (
                  <li key={guess.id} style={{ paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                    <div><strong>{guess.playerName}</strong>: {guess.text}</div>
                    <div style={{ fontSize: '0.875rem', color: guess.correct ? '#16a34a' : '#dc2626' }}>
                      {guess.correct ? '✓ Correct (+100)' : '✗ Incorrect'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isPlaying ? (
              room.isDrawer ? (
                <Canvas disabled={!room.isDrawer} onDraw={handleCanvasDraw} />
              ) : (
                <div style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {room.canvasState ? (
                    <img src={room.canvasState} style={{ maxWidth: '100%', maxHeight: '500px' }} alt="Current drawing" />
                  ) : (
                    <p>Waiting for the drawer to start drawing...</p>
                  )}
                </div>
              )
            ) : (
              <div style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p>Waiting for the host to start the round...</p>
              </div>
            )}
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
                <dt>Status</dt>
                <dd>{room.isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Round</dt>
                <dd>{isPlaying ? "1" : "Preparing"}</dd>
              </div>
              <div>
                <dt>Score</dt>
                <dd>{room.scores[participantId ?? ""] ?? 0}</dd>
              </div>
              {drawer ? (
                <>
                  <div>
                    <dt>Drawer</dt>
                    <dd>{drawer.name}</dd>
                  </div>
                  {room.isDrawer ? (
                    <div>
                      <dt>Secret Word</dt>
                      <dd>{room.secretWord ?? "Loading..."}</dd>
                    </div>
                  ) : null}
                </>
              ) : null}
            </dl>
          </Card>

          <Card title={room.isDrawer ? "Your Drawing Prompt" : "Your Guess"}>
            {room.isDrawer ? (
              <p>{room.secretWord ? `Draw: ${room.secretWord}` : "Fetching your secret word..."}</p>
            ) : (
              <GuessForm onSubmit={handleGuessSubmit} />
            )}
          </Card>
        </aside>
      </div>

      {refreshError && <p style={{ color: '#dc2626', padding: '8px' }}>{refreshError}</p>}

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
