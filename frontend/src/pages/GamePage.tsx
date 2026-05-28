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

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // non-fatal poll error
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [room?.code]);

  if (!room) return null;

  const isDrawer = participantId === room.drawerId;
  const role = isDrawer ? "Drawer" : "Guesser";

  async function handleGuessSubmit(text: string) {
    await roomStore.submitGuess(text);
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">
            {isDrawer ? "Your turn to draw!" : "Guess the Word!"}
          </h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} scores={room.scores} />
          <ResultPanel guesses={room.guesses} participants={room.participants} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            {isDrawer ? (
              <DrawingCanvas />
            ) : (
              <div style={{ minHeight: "500px", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}>
                Waiting for drawer...
              </div>
            )}
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{room.participants.find((p) => p.id === participantId)?.name ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{role}</dd>
              </div>
            </dl>
          </Card>

          {isDrawer && room.secretWord ? (
            <Card title="Secret Word">
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center", padding: "1rem" }}>
                {room.secretWord}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center" }}>
                Only you can see this
              </p>
            </Card>
          ) : null}

          {!isDrawer ? (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} />
            </Card>
          ) : null}
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
