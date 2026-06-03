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

  // Poll the snapshot ~2s so guesses and scores stay in sync for every player.
  const roomCode = room?.code;
  useEffect(() => {
    if (!roomCode) {
      return;
    }

    const interval = setInterval(() => {
      void roomStore.fetchRoom().catch(() => undefined);
    }, 2000);

    return () => clearInterval(interval);
  }, [roomStore, roomCode]);

  // When the host restarts, the room returns to the lobby; move everyone back.
  const roomStatus = room?.status;
  useEffect(() => {
    if (roomStatus === "lobby") {
      navigate("/lobby");
    }
  }, [navigate, roomStatus]);

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((participant) => participant.id === room.drawerId) ?? null;
  const isDrawer = participantId != null && participantId === room.drawerId;
  const isHost = participantId != null && participantId === room.hostId;
  const isEnded = room.status === "ended";

  async function handleGuess(text: string) {
    await roomStore.submitGuess(text);
  }

  async function handleRestart() {
    await roomStore.restartGame();
    // Navigation back to the lobby is handled by the status effect above.
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
          <Scoreboard participants={room.participants} drawerId={room.drawerId} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <p className="drawer-banner">
              {isEnded ? (
                <>
                  Round over! The word was <strong>{room.word}</strong>.
                </>
              ) : isDrawer ? (
                <>
                  You are the drawer. Your word is <strong>{room.word}</strong>.
                </>
              ) : (
                <>
                  <strong>{drawer?.name ?? "The drawer"}</strong> is drawing — guess the word!
                </>
              )}
            </p>
            {isDrawer ? (
              <DrawingCanvas />
            ) : (
              <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
                {isEnded ? "Round over." : "Waiting for the drawer's sketch..."}
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
                <dt>Role</dt>
                <dd>{isDrawer ? "Drawer" : "Guesser"}</dd>
              </div>
            </dl>
          </Card>

          <Card title={isEnded ? "Round Result" : "Your Guess"}>
            {isEnded ? (
              <div className="round-result">
                <p>
                  The word was <strong>{room.word}</strong>.
                </p>
                {isHost ? (
                  <button className="button button--primary" type="button" onClick={handleRestart}>
                    Play Again
                  </button>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Waiting for the host to restart.
                  </p>
                )}
              </div>
            ) : isDrawer ? (
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                You are drawing this round — guessing is for the other players.
              </p>
            ) : (
              <GuessForm onSubmit={handleGuess} />
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
